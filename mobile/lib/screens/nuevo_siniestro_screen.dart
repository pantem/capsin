import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:uuid/uuid.dart';
import 'package:intl/intl.dart';
import 'package:http/http.dart' as http;
import '../services/database_service.dart';
import '../models/siniestro.dart';

class NuevoSiniestroScreen extends StatefulWidget {
  const NuevoSiniestroScreen({super.key});

  @override
  State<NuevoSiniestroScreen> createState() => _NuevoSiniestroScreenState();
}

class _NuevoSiniestroScreenState extends State<NuevoSiniestroScreen> {
  final _formKey = GlobalKey<FormState>();
  final _db = DatabaseService();
  final _uuid = const Uuid();

  static const String _apiBase = 'http://192.168.1.80:4000/api';

  final _direccionCtrl = TextEditingController();
  final _municipioCtrl = TextEditingController();
  final _estadoCtrl = TextEditingController();
  final _codigoPostalCtrl = TextEditingController();
  final _descripcionCtrl = TextEditingController();

  double? _lat;
  double? _lng;
  bool _obteniendoUbicacion = false;

  List<Map<String, dynamic>> _colonias = [];
  bool _cargandoColonias = false;
  String? _coloniaSeleccionada;
  bool _cpCargado = false;

  @override
  void dispose() {
    _direccionCtrl.dispose();
    _municipioCtrl.dispose();
    _estadoCtrl.dispose();
    _codigoPostalCtrl.dispose();
    _descripcionCtrl.dispose();
    super.dispose();
  }

  Future<void> _buscarColonias(String cp) async {
    if (cp.length < 5) {
      setState(() {
        _colonias = [];
        _coloniaSeleccionada = null;
        _cpCargado = false;
      });
      return;
    }
    setState(() => _cargandoColonias = true);
    try {
      final uri = Uri.parse('$_apiBase/codigos-postales?codigo=$cp');
      final response = await http.get(uri);
      if (response.statusCode == 200) {
        final data = (jsonDecode(response.body) as List).cast<Map<String, dynamic>>();
        setState(() {
          _colonias = data;
          _coloniaSeleccionada = null;
          _cpCargado = true;
          if (data.isNotEmpty) {
            _municipioCtrl.text = data.first['municipio'] as String? ?? '';
            _estadoCtrl.text = data.first['estado'] as String? ?? 'CDMX';
            if (data.length == 1) {
              _coloniaSeleccionada = data.first['colonia'] as String?;
            }
          }
        });
      }
    } catch (_) {
      setState(() => _colonias = []);
    } finally {
      setState(() => _cargandoColonias = false);
    }
  }

  Future<void> _obtenerUbicacion() async {
    setState(() => _obteniendoUbicacion = true);
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (!context.mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Activa la ubicación del dispositivo')),
        );
        return;
      }

      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
        if (perm == LocationPermission.denied) return;
      }

      final pos = await Geolocator.getCurrentPosition();
      setState(() {
        _lat = pos.latitude;
        _lng = pos.longitude;
      });
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() => _obteniendoUbicacion = false);
    }
  }

  Future<void> _guardar() async {
    if (!_formKey.currentState!.validate()) return;
    if (_codigoPostalCtrl.text.length == 5 && _coloniaSeleccionada == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selecciona la colonia para el código postal')),
      );
      return;
    }
    if (_lat == null || _lng == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Debes obtener la ubicación')),
      );
      return;
    }

    final folio = 'SIS-${DateFormat('yyyyMMdd-HHmmss').format(DateTime.now())}-${_uuid.v4().substring(0, 4).toUpperCase()}';

    final dirBuf = <String>[];
    if (_direccionCtrl.text.isNotEmpty) dirBuf.add(_direccionCtrl.text);
    if (_coloniaSeleccionada != null) dirBuf.add('Col. $_coloniaSeleccionada');
    if (_codigoPostalCtrl.text.isNotEmpty) dirBuf.add('CP ${_codigoPostalCtrl.text}');

    final siniestro = Siniestro(
      id: _uuid.v4(),
      folio: folio,
      fecha: DateTime.now(),
      lat: _lat!,
      lng: _lng!,
      direccion: dirBuf.join(', '),
      municipio: _municipioCtrl.text,
      estado: _estadoCtrl.text,
      descripcion: _descripcionCtrl.text,
    );

    await _db.insertSiniestro(siniestro);

    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Reporte $folio creado')),
    );
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Nuevo Reporte')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Ubicación', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                    const SizedBox(height: 12),
                    ElevatedButton.icon(
                      onPressed: _obteniendoUbicacion ? null : _obtenerUbicacion,
                      icon: _obteniendoUbicacion
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.gps_fixed),
                      label: Text(_lat != null
                          ? '${_lat!.toStringAsFixed(5)}, ${_lng!.toStringAsFixed(5)}'
                          : 'Obtener ubicación'),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _codigoPostalCtrl,
                      decoration: InputDecoration(
                        labelText: 'Código Postal',
                        border: const OutlineInputBorder(),
                        suffixIcon: _cargandoColonias
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: Padding(
                                  padding: EdgeInsets.all(12),
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                ),
                              )
                            : null,
                      ),
                      keyboardType: TextInputType.number,
                      maxLength: 5,
                      onChanged: _buscarColonias,
                    ),
                    if (_cpCargado && _colonias.length > 1 && _coloniaSeleccionada == null)
                      DropdownButtonFormField<String>(
                        decoration: const InputDecoration(
                          labelText: 'Selecciona la colonia',
                          border: OutlineInputBorder(),
                        ),
                        items: _colonias.map((c) => DropdownMenuItem(
                          value: c['colonia'] as String,
                          child: Text(c['colonia'] as String),
                        )).toList(),
                        onChanged: (v) => setState(() => _coloniaSeleccionada = v),
                      ),
                    if (_coloniaSeleccionada != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Chip(
                          label: Text(_coloniaSeleccionada!),
                          onDeleted: () => setState(() {
                            _coloniaSeleccionada = null;
                            _codigoPostalCtrl.clear();
                            _municipioCtrl.clear();
                            _estadoCtrl.clear();
                            _colonias = [];
                            _cpCargado = false;
                          }),
                        ),
                      ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _direccionCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Dirección (calle y número)',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _municipioCtrl,
                            decoration: const InputDecoration(
                              labelText: 'Municipio',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextFormField(
                            controller: _estadoCtrl,
                            decoration: const InputDecoration(
                              labelText: 'Estado',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Información', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _descripcionCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Descripción',
                        border: OutlineInputBorder(),
                      ),
                      maxLines: 3,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _guardar,
              icon: const Icon(Icons.save),
              label: const Text('Guardar Reporte'),
            ),
          ],
        ),
      ),
    );
  }
}
