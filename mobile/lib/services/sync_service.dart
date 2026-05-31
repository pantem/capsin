import 'dart:convert';
import 'package:http/http.dart' as http;
import 'database_service.dart';

class SyncService {
  static const String _baseUrl = 'https://capsin.onrender.com/api';

  final DatabaseService _db = DatabaseService();

  Future<SyncResult> sincronizar() async {
    int subidos = 0;
    int errores = 0;

    try {
      final tiposPendientes = await _db.getTiposInmueble();
      final siniestrosPendientes = await _db.getSiniestrosNoSincronizados();

      if (tiposPendientes.isEmpty && siniestrosPendientes.isEmpty) {
        return SyncResult(subidos: 0, errores: 0, mensaje: 'Sin datos pendientes');
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

    return SyncResult(
      subidos: subidos,
      errores: errores,
      mensaje: subidos > 0
          ? '$subidos siniestro(s) sincronizado(s)'
          : errores > 0
              ? 'Error al sincronizar'
              : 'Sincronizado correctamente',
    );
  }
}

class SyncResult {
  final int subidos;
  final int errores;
  final String mensaje;

  SyncResult({required this.subidos, required this.errores, required this.mensaje});
}
