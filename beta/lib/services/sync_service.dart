import 'dart:convert';
import 'package:http/http.dart' as http;
import 'database_service.dart';

class SyncService {
  static const String baseUrl = 'https://capsin.onrender.com/api';

  final DatabaseService _db = DatabaseService();

  Future<int> sincronizar() async {
    final pendientes = await _db.obtenerPendientes();
    if (pendientes.isEmpty) return 0;

    int ok = 0;
    for (final r in pendientes) {
      try {
        final body = {
          'folio': r.folio,
          'ubicacion': {
            'lat': r.lat,
            'lng': r.lng,
            'direccion': '${r.calle} #${r.numero}',
          },
          'descripcion': 'Beta - captura rápida',
        };

        final resp = await http.post(
          Uri.parse('$baseUrl/siniestros'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode(body),
        );

        if (resp.statusCode == 201) {
          await _db.marcarSincronizado(r.id!);
          ok++;
        }
      } catch (_) {}
    }
    return ok;
  }
}
