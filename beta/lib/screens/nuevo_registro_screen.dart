import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:uuid/uuid.dart';
import 'package:intl/intl.dart';
import '../models/registro.dart';
import '../services/database_service.dart';

class NuevoRegistroScreen extends StatefulWidget {
  const NuevoRegistroScreen({super.key});

  @override
  State<NuevoRegistroScreen> createState() => _NuevoRegistroScreenState();
}

class _NuevoRegistroScreenState extends State<NuevoRegistroScreen> {
  final _calleCtrl = TextEditingController();
  final _numeroCtrl = TextEditingController();
  final _db = DatabaseService();

  double? _lat;
  double? _lng;
  bool _cargandoGps = false;

  @override
  void dispose() {
    _calleCtrl.dispose();
    _numeroCtrl.dispose();
    super.dispose();
  }

  Future<void> _capturarGps() async {
    setState(() => _cargandoGps = true);
    try {
      bool enabled = await Geolocator.isLocationServiceEnabled();
      if (!enabled) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Activa la ubicación del dispositivo')),
          );
        }
        return;
      }

      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.deniedForever) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Permiso de ubicación denegado permanentemente')),
          );
        }
        return;
      }

      Position pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );
      setState(() {
        _lat = pos.latitude;
        _lng = pos.longitude;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al obtener ubicación: $e')),
        );
      }
    } finally {
      setState(() => _cargandoGps = false);
    }
  }

  Future<void> _guardar() async {
    if (_lat == null || _lng == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Primero captura la ubicación GPS')),
      );
      return;
    }
    if (_calleCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ingresa el nombre de la calle')),
      );
      return;
    }

    final folio = 'BETA-${DateFormat('yyyyMMdd-HHmmss').format(DateTime.now())}-${const Uuid().v4().substring(0, 4)}';
    final r = Registro(
      folio: folio,
      lat: _lat!,
      lng: _lng!,
      calle: _calleCtrl.text.trim(),
      numero: _numeroCtrl.text.trim(),
    );
    await _db.insertar(r);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Registro guardado')),
      );
      Navigator.pop(context, true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Nuevo registro')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ElevatedButton.icon(
              onPressed: _cargandoGps ? null : _capturarGps,
              icon: _cargandoGps
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.gps_fixed),
              label: Text(_lat != null
                  ? 'Lat: ${_lat!.toStringAsFixed(6)}, Lng: ${_lng!.toStringAsFixed(6)}'
                  : 'Capturar ubicación GPS'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _calleCtrl,
              decoration: const InputDecoration(
                labelText: 'Calle',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.signpost),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _numeroCtrl,
              decoration: const InputDecoration(
                labelText: 'Número exterior',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.numbers),
              ),
              keyboardType: TextInputType.text,
            ),
            const SizedBox(height: 32),
            FilledButton.icon(
              onPressed: _guardar,
              icon: const Icon(Icons.save),
              label: const Text('Guardar registro'),
              style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
            ),
          ],
        ),
      ),
    );
  }
}
