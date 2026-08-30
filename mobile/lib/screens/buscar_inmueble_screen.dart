import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import '../config.dart';
import '../services/database_service.dart';
import '../models/inmueble_padron.dart';
import 'reporte_seguimiento_screen.dart';

class BuscarInmuebleScreen extends StatefulWidget {
  const BuscarInmuebleScreen({super.key});

  @override
  State<BuscarInmuebleScreen> createState() => _BuscarInmuebleScreenState();
}

class _BuscarInmuebleScreenState extends State<BuscarInmuebleScreen> {
  final DatabaseService _db = DatabaseService();
  List<InmueblePadron> _inmueblesCercanos = [];
  bool _cargando = true;
  bool _error = false;
  String _mensaje = '';
  double? _latActual;
  double? _lngActual;

  @override
  void initState() {
    super.initState();
    _buscarInmueblesCercanos();
  }

  Future<void> _buscarInmueblesCercanos() async {
    setState(() {
      _cargando = true;
      _error = false;
      _mensaje = '';
    });

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _cargando = false;
          _error = true;
          _mensaje = 'Activa la ubicación del dispositivo';
        });
        return;
      }

      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
        if (perm == LocationPermission.denied) {
          setState(() {
            _cargando = false;
            _error = true;
            _mensaje = 'Permiso de ubicación denegado';
          });
          return;
        }
      }

      final pos = await Geolocator.getCurrentPosition();
      _latActual = pos.latitude;
      _lngActual = pos.longitude;

      try {
        final uri = Uri.parse(
            '${AppConfig.apiBaseUrl}/inmuebles-padron/cercanos?lat=$_latActual&lng=$_lngActual&radio=1000');
        final response = await http.get(uri);
        if (response.statusCode == 200) {
          final data = jsonDecode(response.body) as List;
          _inmueblesCercanos = data
              .map((j) => InmueblePadron.fromJson(j as Map<String, dynamic>))
              .toList();
        }
      } catch (_) {
        _inmueblesCercanos = await _db.getInmueblesCercanos(
            _latActual!, _lngActual!, 1000);
      }

      if (_inmueblesCercanos.isEmpty) {
        _mensaje = 'No se encontraron inmuebles en un radio de 1 km';
      }

      setState(() => _cargando = false);
    } catch (e) {
      setState(() {
        _cargando = false;
        _error = true;
        _mensaje = 'Error: $e';
      });
    }
  }

  Color _colorEstado(String estado) {
    switch (estado) {
      case 'critico':
        return Colors.red;
      case 'moderado':
        return Colors.orange;
      default:
        return Colors.green;
    }
  }

  String _labelEstado(String estado) {
    switch (estado) {
      case 'critico':
        return 'Crítico';
      case 'moderado':
        return 'Moderado';
      default:
        return 'Sin daños';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Buscar Inmueble'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _buscarInmueblesCercanos,
            tooltip: 'Actualizar',
          ),
        ],
      ),
      body: _cargando
          ? const Center(child: CircularProgressIndicator())
          : _error
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.error_outline, size: 64, color: Colors.red),
                      const SizedBox(height: 16),
                      Text(_mensaje,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontSize: 16)),
                      const SizedBox(height: 16),
                      FilledButton.icon(
                        onPressed: _buscarInmueblesCercanos,
                        icon: const Icon(Icons.refresh),
                        label: const Text('Reintentar'),
                      ),
                    ],
                  ),
                )
              : Column(
                  children: [
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      color: Theme.of(context).colorScheme.primaryContainer,
                      child: Row(
                        children: [
                          const Icon(Icons.location_on, size: 20),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _latActual != null
                                  ? 'Ubicación: ${_latActual!.toStringAsFixed(5)}, ${_lngActual!.toStringAsFixed(5)} · Radio: 1 km'
                                  : 'Sin ubicación',
                              style: const TextStyle(fontSize: 13),
                            ),
                          ),
                          Text(
                            '${_inmueblesCercanos.length} inmueble(s)',
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                    if (_mensaje.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: Text(_mensaje,
                            style: const TextStyle(color: Colors.grey)),
                      ),
                    Expanded(
                      child: _inmueblesCercanos.isEmpty
                          ? const Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.search_off,
                                      size: 64, color: Colors.grey),
                                  SizedBox(height: 16),
                                  Text('No hay inmuebles cercanos',
                                      style: TextStyle(
                                          color: Colors.grey, fontSize: 16)),
                                ],
                              ),
                            )
                          : RefreshIndicator(
                              onRefresh: _buscarInmueblesCercanos,
                              child: ListView.builder(
                                padding: const EdgeInsets.all(12),
                                itemCount: _inmueblesCercanos.length,
                                itemBuilder: (_, i) {
                                  final inm = _inmueblesCercanos[i];
                                  final reporteReciente =
                                      inm.fechaUltimoReporte != null;
                                  return Card(
                                    margin: const EdgeInsets.only(bottom: 8),
                                    child: ListTile(
                                      leading: CircleAvatar(
                                        backgroundColor: _colorEstado(
                                                inm.estadoAfectacion)
                                            .withOpacity(0.15),
                                        child: Icon(Icons.location_city,
                                            color: _colorEstado(
                                                inm.estadoAfectacion)),
                                      ),
                                      title: Text(inm.nombre,
                                          style: const TextStyle(
                                              fontWeight: FontWeight.bold)),
                                      subtitle: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                              '${inm.direccion}\n${inm.colonia}, ${inm.alcaldia}',
                                              maxLines: 2,
                                              overflow:
                                                  TextOverflow.ellipsis),
                                          const SizedBox(height: 4),
                                          Row(
                                            children: [
                                              Container(
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                        horizontal: 8,
                                                        vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: _colorEstado(
                                                          inm.estadoAfectacion)
                                                      .withOpacity(0.1),
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                          12),
                                                ),
                                                child: Text(
                                                  _labelEstado(
                                                      inm.estadoAfectacion),
                                                  style: TextStyle(
                                                    fontSize: 11,
                                                    color: _colorEstado(
                                                        inm.estadoAfectacion),
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                              ),
                                              if (reporteReciente) ...[
                                                const SizedBox(width: 8),
                                                Icon(Icons.check_circle,
                                                    size: 16,
                                                    color: Colors.grey[500]),
                                                const SizedBox(width: 2),
                                                Text(
                                                  'Reportado',
                                                  style: TextStyle(
                                                    fontSize: 11,
                                                    color: Colors.grey[500],
                                                  ),
                                                ),
                                              ],
                                            ],
                                          ),
                                        ],
                                      ),
                                      trailing:
                                          const Icon(Icons.chevron_right),
                                      onTap: () async {
                                        await Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (_) =>
                                                ReporteSeguimientoScreen(
                                              inmueblePadron: inm,
                                            ),
                                          ),
                                        );
                                        _buscarInmueblesCercanos();
                                      },
                                    ),
                                  );
                                },
                              ),
                            ),
                    ),
                  ],
                ),
    );
  }
}
