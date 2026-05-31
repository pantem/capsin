import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:uuid/uuid.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'database_service.dart';
import '../models/siniestro.dart';
import '../models/inmueble.dart';
import '../models/damnificado.dart';
import '../models/valor_caracteristica.dart';

class SyncService {
  static const String _baseUrl = 'https://capsin.onrender.com/api';
  static const String _deviceIdKey = 'dispositivo_id';

  final DatabaseService _db = DatabaseService();
  final _uuid = const Uuid();
  String? _dispositivoId;

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

    try {
      final did = await dispositivoId;

      final descargadosCount = await _descargar(did);
      descargados = descargadosCount;

      final tiposPendientes = await _db.getTiposInmueble();
      final siniestrosPendientes = await _db.getSiniestrosNoSincronizados();

      if (tiposPendientes.isEmpty && siniestrosPendientes.isEmpty) {
        final msg = descargados > 0
            ? '$descargados reporte(s) descargado(s)'
            : 'Sin datos pendientes';
        return SyncResult(subidos: 0, errores: 0, mensaje: msg);
      }

      bool tiposSynced = false;

      for (final siniestro in siniestrosPendientes) {
        try {
          final inmuebles = await _db.getInmuebles(siniestro.id);
          final inmueblesJson = <Map<String, dynamic>>[];

          for (final inm in inmuebles) {
            final valores = await _db.getValoresCaracteristica(inm.id);
            final damnificados = await _db.getDamnificados(inm.id);
            final inmJson = inm.toJson();
            inmJson['valores_caracteristica'] = valores.map((v) => v.toJson()).toList();
            inmJson['damnificados'] = damnificados.map((d) => d.toJson()).toList();
            inmueblesJson.add(inmJson);
          }

          final body = {
            'dispositivo_id': did,
            'siniestros': [
              {
                ...siniestro.toJson(),
                'inmuebles': inmueblesJson,
              }
            ],
            if (tiposPendientes.isNotEmpty && !tiposSynced)
              'tipos_inmueble': tiposPendientes.map((t) => t.toJson()).toList(),
          };

          final response = await http.post(
            Uri.parse('$_baseUrl/siniestros/sync'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(body),
          );

          if (response.statusCode == 200) {
            tiposSynced = true;
            await _db.marcarSiniestroSincronizado(siniestro.id);
            for (final inm in inmuebles) {
              await _db.marcarInmuebleSincronizado(inm.id);
              final damns = await _db.getDamnificados(inm.id);
              for (final d in damns) {
                await _db.marcarDamnificadoSincronizado(d.id);
              }
            }
            subidos++;
          } else {
            errores++;
          }
        } catch (e) {
          errores++;
        }
      }

      if (tiposPendientes.isNotEmpty && !tiposSynced) {
        try {
          final response = await http.post(
            Uri.parse('$_baseUrl/siniestros/sync'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'dispositivo_id': did,
              'siniestros': [],
              'tipos_inmueble': tiposPendientes.map((t) => t.toJson()).toList(),
            }),
          );
          if (response.statusCode == 200) {
            tiposSynced = true;
          } else {
            errores++;
          }
        } catch (e) {
          errores++;
        }
      }
    } catch (e) {
      return SyncResult(subidos: 0, errores: 1, mensaje: 'Error de conexión: $e');
    }

    final partes = <String>[];
    if (descargados > 0) partes.add('$descargados descargado(s)');
    if (subidos > 0) partes.add('$subidos subido(s)');
    if (errores > 0) partes.add('$errores error(es)');
    final msg = partes.isNotEmpty ? partes.join(', ') : 'Sincronizado correctamente';

    return SyncResult(subidos: subidos, errores: errores, mensaje: msg);
  }

  Future<int> _descargar(String did) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/siniestros/pull?dispositivo=$did'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode != 200) return 0;

      final data = jsonDecode(response.body) as List;
      int count = 0;

      for (final item in data) {
        final folio = item['folio'] as String?;
        if (folio == null) continue;

        final existentes = await _db.getSiniestros();
        final yaExiste = existentes.any((s) => s.folio == folio);
        if (yaExiste) continue;

        final siniestroId = _uuid.v4();
        final siniestro = Siniestro(
          id: siniestroId,
          folio: folio,
          fecha: DateTime.tryParse(item['fecha'] as String? ?? '') ?? DateTime.now(),
          lat: (item['lat'] as num?)?.toDouble() ?? 0,
          lng: (item['lng'] as num?)?.toDouble() ?? 0,
          direccion: item['direccion'] as String? ?? '',
          municipio: item['municipio'] as String? ?? '',
          estado: item['estado'] as String? ?? '',
          descripcion: item['descripcion'] as String? ?? '',
          sincronizado: true,
        );
        await _db.insertSiniestro(siniestro);

        final inmueblesData = item['inmuebles'] as List? ?? [];
        for (final inmData in inmueblesData) {
          final inmuebleId = _uuid.v4();
          final inmueble = Inmueble(
            id: inmuebleId,
            siniestroId: siniestroId,
            tipo: inmData['tipo'] as String? ?? '',
            tipoInmuebleId: inmData['tipoInmuebleId'] as String?,
            numeroNiveles: inmData['numeroNiveles'] as int? ?? 1,
            tipoUnidad: inmData['tipoUnidad'] as String? ?? '',
            esPadre: (inmData['esPadre'] as int? ?? 0) == 1,
            padreId: inmData['padreId'] as String?,
            identificador: inmData['identificador'] as String? ?? '',
            estadoAfectacion: inmData['estadoAfectacion'] as String? ?? 'sin_daños',
            observaciones: inmData['observaciones'] as String? ?? '',
            sincronizado: true,
          );
          await _db.insertInmueble(inmueble);

          final valores = inmData['valores_caracteristica'] as List? ?? [];
          for (final v in valores) {
            final valor = ValorCaracteristica(
              id: _uuid.v4(),
              inmuebleId: inmuebleId,
              caracteristicaId: v['caracteristicaId'] as String? ?? '',
              valorTexto: v['valorTexto'] as String?,
              valorNumero: (v['valorNumero'] as num?)?.toDouble(),
              valorBooleano: v['valorBooleano'] == null ? null : (v['valorBooleano'] as int) == 1,
              valorSeleccion: v['valorSeleccion'] as String?,
            );
            await _db.insertValorCaracteristica(valor);
          }

          final damnificadosData = inmData['damnificados'] as List? ?? [];
          for (final d in damnificadosData) {
            final damnificado = Damnificado(
              id: _uuid.v4(),
              inmuebleId: inmuebleId,
              nombre: d['nombre'] as String? ?? '',
              edad: d['edad'] as int? ?? 0,
              sexo: d['sexo'] as String? ?? '',
              tipoIdentificacion: d['tipoIdentificacion'] as String? ?? '',
              numeroIdentificacion: d['numeroIdentificacion'] as String? ?? '',
              estado: d['estado'] as String? ?? 'ileso',
              requiereTraslado: (d['requiereTraslado'] as int? ?? 0) == 1,
              observaciones: d['observaciones'] as String? ?? '',
              sincronizado: true,
            );
            await _db.insertDamnificado(damnificado);
          }
        }
        count++;
      }
      return count;
    } catch (e) {
      return 0;
    }
  }
}

class SyncResult {
  final int subidos;
  final int errores;
  final String mensaje;

  SyncResult({required this.subidos, required this.errores, required this.mensaje});
}
