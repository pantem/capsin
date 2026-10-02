import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:uuid/uuid.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config.dart';
import 'database_service.dart';
import '../models/reporte.dart';
import '../models/damnificado.dart';
import '../models/tipo_inmueble.dart';
import '../models/caracteristica_tipo.dart';
import '../models/valor_caracteristica.dart';

class SyncService {
  String get _baseUrl => AppConfig.apiBaseUrl;
  static const String _deviceIdKey = 'dispositivo_id';

  final DatabaseService _db = DatabaseService();
  final _uuid = const Uuid();
  String? _dispositivoId;
  int _fotosSubidas = 0;
  int _fotosPendientes = 0;
  String? _errorFotos;

  Future<String> get dispositivoId async {
    if (_dispositivoId != null) return _dispositivoId!;
    final prefs = await SharedPreferences.getInstance();
    _dispositivoId = prefs.getString(_deviceIdKey);
    if (_dispositivoId == null) {
      _dispositivoId = _uuid.v4();
      await prefs.setString(_deviceIdKey, _dispositivoId!);
    }
    return _dispositivoId!;
  }

  Future<SyncResult> sincronizar() async {
    int subidos = 0;
    int errores = 0;
    int descargados = 0;
    _fotosSubidas = 0;
    _fotosPendientes = 0;
    _errorFotos = null;

    try {
      final did = await dispositivoId;

      final tiposResult = await _sincronizarTipos();
      final tiposOk = tiposResult['ok'] as bool;

      final descargadosCount = await _descargar(did);
      descargados = descargadosCount;

      await _reintentarFotosPendientes();

      final pendientes = await _db.getReportesNoSincronizados();

      if (pendientes.isEmpty) {
        if (!tiposOk && descargados == 0) {
          return SyncResult(subidos: 0, errores: 1, mensaje: 'Error: ${tiposResult['error'] ?? 'Sin conexión'}');
        }
        return SyncResult(
            subidos: 0,
            errores: 0,
            mensaje: _mensajeResultado(descargados: descargados));
      }

      for (final reporte in pendientes) {
        try {
          final damnificados = await _db.getDamnificados(reporte.id);
          final valores = await _db.getValoresCaracteristica(reporte.id);

          final body = {
            'dispositivo_id': did,
            'reportes': [
              {
                ...reporte.toJson(),
                'valores_caracteristica':
                    valores.map((v) => v.toJson()).toList(),
                'damnificados': damnificados.map((d) => d.toJson()).toList(),
              }
            ],
          };

          final response = await http.post(
            Uri.parse('$_baseUrl/reportes/sync'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(body),
          );

          if (response.statusCode == 200) {
            final resData = jsonDecode(response.body) as Map<String, dynamic>;
            final siniestros = resData['siniestros'] as List? ?? [];
            final siniestroFolio = siniestros.isNotEmpty ? siniestros[0]['folio'] as String : null;

            if (siniestroFolio != null && reporte.fotos.isNotEmpty) {
              final res = await _subirFotos(siniestroFolio, reporte.fotos);
              _fotosSubidas += res.nuevas;
              _fotosPendientes += res.pendientes.length;
              if (res.error != null) _errorFotos = res.error;
              await _db.actualizarFotosReporte(
                  reporte.id, [...res.urls, ...res.pendientes].join(','));
            }

            await _db.marcarReporteSincronizado(reporte.id);
            await _db.derivarEstadoAfectacion(reporte.id);
            for (final d in damnificados) {
              await _db.marcarDamnificadoSincronizado(d.id);
            }
            subidos++;
          } else {
            errores++;
          }
        } catch (e) {
          errores++;
        }
      }
    } catch (e) {
      return SyncResult(
          subidos: 0, errores: 1, mensaje: 'Error de conexión: $e');
    }

    return SyncResult(
        subidos: subidos,
        errores: errores,
        mensaje: _mensajeResultado(
            subidos: subidos, descargados: descargados, errores: errores));
  }

  String _mensajeResultado(
      {int subidos = 0, int descargados = 0, int errores = 0}) {
    final partes = <String>[];
    if (descargados > 0) partes.add('$descargados descargado(s)');
    if (subidos > 0) partes.add('$subidos subido(s)');
    if (_fotosSubidas > 0) partes.add('$_fotosSubidas foto(s) subida(s)');
    if (_fotosPendientes > 0) {
      final detalle = _errorFotos != null ? ': ${_errorFotos!}' : '';
      partes.add('$_fotosPendientes foto(s) pendiente(s)$detalle');
    }
    if (errores > 0) partes.add('$errores error(es)');
    return partes.isNotEmpty ? partes.join(', ') : 'Sincronizado correctamente';
  }

  Future<Map<String, dynamic>> _sincronizarTipos() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/tipos-inmueble?activos=true'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 30));
      if (response.statusCode != 200) {
        return {'ok': false, 'error': 'Error HTTP ${response.statusCode}'};
      }

      final tiposJson = jsonDecode(response.body) as List;
      final tipos = tiposJson
          .map((j) => TipoInmueble.fromJson(j as Map<String, dynamic>))
          .toList();

      if (tipos.isEmpty) return {'ok': false, 'error': 'Sin tipos en el servidor'};
      await _db.insertTiposInmueble(tipos);

      for (final tipo in tipos) {
        final caractsResponse = await http.get(
          Uri.parse('$_baseUrl/tipos-inmueble/${tipo.id}/caracteristicas'),
          headers: {'Content-Type': 'application/json'},
        ).timeout(const Duration(seconds: 30));
        if (caractsResponse.statusCode != 200) continue;

        final caractsJson = jsonDecode(caractsResponse.body) as List;
        final caracts = caractsJson
            .map((j) => CaracteristicaTipo.fromJson(j as Map<String, dynamic>))
            .toList();

        await _db.insertCaracteristicas(tipo.id, caracts);
      }
      return {'ok': true};
    } catch (e) {
      return {'ok': false, 'error': e.toString()};
    }
  }

  Future<_ResultadoFotos> _subirFotos(String folio, String fotosPath) async {
    final urls = <String>[];
    final pendientes = <String>[];
    int nuevas = 0;
    String? error;

    final partes = fotosPath
        .split(',')
        .map((p) => p.trim())
        .where((p) => p.isNotEmpty)
        .toList();

    for (final parte in partes) {
      if (parte.startsWith('http')) {
        urls.add(parte);
        continue;
      }

      final file = File(parte);
      if (!await file.exists()) continue;

      try {
        final request =
            http.MultipartRequest('POST', Uri.parse('$_baseUrl/fotos/$folio'));
        request.files.add(await http.MultipartFile.fromPath('fotos', parte));

        final streamed =
            await request.send().timeout(const Duration(seconds: 120));
        final response = await http.Response.fromStream(streamed);

        if (response.statusCode == 200) {
          final data = jsonDecode(response.body) as Map<String, dynamic>;
          final subidas = (data['fotos'] as List? ?? [])
              .map((f) => ((f as Map)['url']) as String?)
              .whereType<String>()
              .toList();
          if (subidas.isNotEmpty) {
            urls.add(subidas.last);
            nuevas++;
            continue;
          }
          error = 'Respuesta sin fotos';
        } else {
          error = 'HTTP ${response.statusCode}: ${response.body}';
        }
      } catch (e) {
        error = e.toString();
      }

      pendientes.add(parte);
    }

    return _ResultadoFotos(
        urls: urls, pendientes: pendientes, nuevas: nuevas, error: error);
  }

  Future<void> _reintentarFotosPendientes() async {
    try {
      final reportes = await _db.getReportesConFotosLocales();
      for (final reporte in reportes) {
        if (!reporte.sincronizado) continue;

        final res = await _subirFotos(reporte.folio, reporte.fotos);
        _fotosSubidas += res.nuevas;
        _fotosPendientes += res.pendientes.length;
        if (res.error != null) _errorFotos = res.error;
        await _db.actualizarFotosReporte(
            reporte.id, [...res.urls, ...res.pendientes].join(','));
      }
    } catch (_) {
      // Los reintentos de fotos no deben detener la sincronización
    }
  }

  Future<int> _descargar(String did) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/reportes/pull?dispositivo=$did'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode != 200) return 0;

      final data = jsonDecode(response.body) as List;
      int count = 0;

      for (final item in data) {
        final folio = item['folio'] as String?;
        if (folio == null) continue;

        final existentes = await _db.getReportes();
        final yaExiste = existentes.any((r) => r.folio == folio);
        if (yaExiste) continue;

        final reporteId = _uuid.v4();
        final reporte = Reporte(
          id: reporteId,
          folio: folio,
          fecha: DateTime.tryParse(item['fecha'] as String? ?? '')
                  ?.toLocal() ??
              DateTime.now(),
          nombreCapturista: item['nombre_capturista'] as String? ?? '',
          area: item['area'] as String? ?? '',
          calleNumero: item['calle_numero'] as String? ?? '',
          colonia: item['colonia'] as String? ?? '',
          alcaldia: item['alcaldia'] as String? ?? '',
          codigoPostal: item['codigo_postal'] as String? ?? '',
          lat: (item['lat'] as num?)?.toDouble(),
          lng: (item['lng'] as num?)?.toDouble(),
          usoInmueble: item['uso_inmueble'] as String? ?? '',
          otroUso: item['otro_uso'] as String?,
          fechaConstruccion: item['fecha_construccion'] as String? ?? '',
          sobreNivelBanqueta: item['sobre_nivel_banqueta'] as int? ?? 0,
          bajoNivelBanqueta: item['bajo_nivel_banqueta'] as int? ?? 0,
          danosObservados: item['danos_observados'] as String? ?? '',
          estadoAfectacion: item['estado_afectacion'] as String? ?? 'sin_daños',
          condicionSeguridad: item['condicion_seguridad'] as String? ?? '',
          observaciones: item['observaciones'] as String? ?? '',
          fotos: item['fotos'] as String? ?? '',
          sincronizado: true,
        );
        await _db.insertReporte(reporte);

        final valoresData = item['valores_caracteristica'] as List? ?? [];
        if (valoresData.isNotEmpty) {
          final valores = valoresData.map((v) => ValorCaracteristica(
                id: _uuid.v4(),
                reporteId: reporteId,
                caracteristicaId: v['caracteristica_id'] as String? ?? '',
                valorTexto: v['valor_texto'] as String?,
                valorNumero: (v['valor_numero'] as num?)?.toDouble(),
                valorBooleano: v['valor_booleano'] == null
                    ? null
                    : (v['valor_booleano'] as int) == 1,
                valorSeleccion: v['valor_seleccion'] as String?,
                valorTextoCondicional: v['valor_texto_condicional'] as String?,
              )).toList();
          await _db.insertValoresCaracteristica(valores);
        }

        final damnificadosData = item['damnificados'] as List? ?? [];
        for (final d in damnificadosData) {
          final damnificado = Damnificado(
            id: _uuid.v4(),
            reporteId: reporteId,
            nombre: d['nombre'] as String? ?? '',
            edad: d['edad'] as int? ?? 0,
            sexo: d['sexo'] as String? ?? '',
            tipoIdentificacion: d['tipo_identificacion'] as String? ?? '',
            numeroIdentificacion: d['numero_identificacion'] as String? ?? '',
            estado: d['estado'] as String? ?? 'ileso',
            requiereTraslado: (d['requiere_traslado'] as int? ?? 0) == 1,
            observaciones: d['observaciones'] as String? ?? '',
            sincronizado: true,
          );
          await _db.insertDamnificado(damnificado);
        }
        count++;
      }
      return count;
    } catch (e) {
      return 0;
    }
  }
}

class _ResultadoFotos {
  final List<String> urls;
  final List<String> pendientes;
  final int nuevas;
  final String? error;

  _ResultadoFotos({
    required this.urls,
    required this.pendientes,
    required this.nuevas,
    this.error,
  });
}

class SyncResult {
  final int subidos;
  final int errores;
  final String mensaje;

  SyncResult(
      {required this.subidos, required this.errores, required this.mensaje});
}
