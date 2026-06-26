import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:uuid/uuid.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'database_service.dart';
import '../models/reporte.dart';
import '../models/damnificado.dart';

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

      final pendientes = await _db.getReportesNoSincronizados();

      if (pendientes.isEmpty) {
        final msg = descargados > 0
            ? '$descargados reporte(s) descargado(s)'
            : 'Sin datos pendientes';
        return SyncResult(subidos: 0, errores: 0, mensaje: msg);
      }

      for (final reporte in pendientes) {
        try {
          final damnificados = await _db.getDamnificados(reporte.id);

          final body = {
            'dispositivo_id': did,
            'reportes': [
              {
                ...reporte.toJson(),
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
            await _db.marcarReporteSincronizado(reporte.id);
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
      return SyncResult(subidos: 0, errores: 1, mensaje: 'Error de conexión: $e');
    }

    final partes = <String>[];
    if (descargados > 0) partes.add('$descargados descargado(s)');
    if (subidos > 0) partes.add('$subidos subido(s)');
    if (errores > 0) partes.add('$errores error(es)');
    final msg =
        partes.isNotEmpty ? partes.join(', ') : 'Sincronizado correctamente';

    return SyncResult(subidos: subidos, errores: errores, mensaje: msg);
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
          fecha: DateTime.tryParse(item['fecha'] as String? ?? '') ??
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
          numeroNiveles: item['numero_niveles'] as int? ?? 1,
          danosObservados: item['danos_observados'] as String? ?? '',
          condicionSeguridad: item['condicion_seguridad'] as String? ?? '',
          observaciones: item['observaciones'] as String? ?? '',
          fotos: item['fotos'] as String? ?? '',
          sincronizado: true,
        );
        await _db.insertReporte(reporte);

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

class SyncResult {
  final int subidos;
  final int errores;
  final String mensaje;

  SyncResult(
      {required this.subidos, required this.errores, required this.mensaje});
}
