import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:uuid/uuid.dart';
import 'package:intl/intl.dart';
import '../services/database_service.dart';
import '../models/reporte.dart';

class NuevoReporteScreen extends StatefulWidget {
  const NuevoReporteScreen({super.key});

  @override
  State<NuevoReporteScreen> createState() => _NuevoReporteScreenState();
}

class _NuevoReporteScreenState extends State<NuevoReporteScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _db = DatabaseService();
  final _uuid = const Uuid();

  late TabController _tabController;

  // 1. Datos Generales
  final _nombreCapturistaCtrl = TextEditingController();
  final _areaCtrl = TextEditingController();

  // 2. Información del inmueble
  final _calleNumeroCtrl = TextEditingController();
  final _coloniaCtrl = TextEditingController();
  final _alcaldiaCtrl = TextEditingController();
  final _codigoPostalCtrl = TextEditingController();

  // 2.1 Uso del Inmueble
  String _usoInmueble = '';
  final _otroUsoCtrl = TextEditingController();
  final _fechaConstruccionCtrl = TextEditingController();
  int _numeroNiveles = 1;

  // 3. Daños
  final Set<String> _danosSeleccionados = {};

  // 4. Condición de seguridad
  String _condicionSeguridad = '';

  // 5. Observaciones
  final _observacionesCtrl = TextEditingController();

  // 6. Fotografías
  final List<String> _fotos = [];

  double? _lat;
  double? _lng;
  bool _obteniendoUbicacion = false;

  static const List<String> _usos = [
    'vivienda_unifamiliar',
    'vivienda_multifamiliar',
    'escuela',
    'hospital',
    'oficina',
    'comercio',
    'otro',
  ];

  static const Map<String, String> _usosLabel = {
    'vivienda_unifamiliar': 'Vivienda Unifamiliar',
    'vivienda_multifamiliar': 'Vivienda Multifamiliar',
    'escuela': 'Escuela',
    'hospital': 'Hospital',
    'oficina': 'Oficina',
    'comercio': 'Comercio',
    'otro': 'Otro',
  };

  static const List<String> _danos = [
    'grietas_leves',
    'grietas_estructurales',
    'desprendimiento_acabados',
    'dano_columnas',
    'dano_trabes',
    'inclinacion',
    'colapso_parcial',
    'colapso_total',
  ];

  static const Map<String, String> _danosLabel = {
    'grietas_leves': 'Grietas leves',
    'grietas_estructurales': 'Grietas estructurales',
    'desprendimiento_acabados': 'Desprendimiento de acabados',
    'dano_columnas': 'Daño en columnas',
    'dano_trabes': 'Daño en trabes',
    'inclinacion': 'Inclinación',
    'colapso_parcial': 'Colapso parcial',
    'colapso_total': 'Colapso total',
  };

  static const List<String> _condiciones = [
    'segura',
    'riesgo_alto',
    'riesgo_medio',
    'riesgo_bajo',
  ];

  static const Map<String, String> _condLabel = {
    'segura': 'Edificación segura',
    'riesgo_alto': 'Riesgo alto',
    'riesgo_medio': 'Riesgo medio',
    'riesgo_bajo': 'Riesgo bajo',
  };

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 6, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _nombreCapturistaCtrl.dispose();
    _areaCtrl.dispose();
    _calleNumeroCtrl.dispose();
    _coloniaCtrl.dispose();
    _alcaldiaCtrl.dispose();
    _codigoPostalCtrl.dispose();
    _otroUsoCtrl.dispose();
    _fechaConstruccionCtrl.dispose();
    _observacionesCtrl.dispose();
    super.dispose();
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

    if (_usoInmueble.isEmpty) {
      _tabController.animateTo(1);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selecciona el uso del inmueble')),
      );
      return;
    }

    if (_condicionSeguridad.isEmpty) {
      _tabController.animateTo(3);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selecciona la condición de seguridad')),
      );
      return;
    }

    final folio =
        'SIS-${DateFormat('yyyyMMdd-HHmmss').format(DateTime.now())}-${_uuid.v4().substring(0, 4).toUpperCase()}';

    final reporte = Reporte(
      id: _uuid.v4(),
      folio: folio,
      fecha: DateTime.now(),
      nombreCapturista: _nombreCapturistaCtrl.text,
      area: _areaCtrl.text,
      calleNumero: _calleNumeroCtrl.text,
      colonia: _coloniaCtrl.text,
      alcaldia: _alcaldiaCtrl.text,
      codigoPostal: _codigoPostalCtrl.text,
      lat: _lat,
      lng: _lng,
      usoInmueble: _usoInmueble,
      otroUso: _usoInmueble == 'otro' ? _otroUsoCtrl.text : null,
      fechaConstruccion: _fechaConstruccionCtrl.text,
      numeroNiveles: _numeroNiveles,
      danosObservados: _danosSeleccionados.join(','),
      condicionSeguridad: _condicionSeguridad,
      observaciones: _observacionesCtrl.text,
      fotos: _fotos.join(','),
    );

    await _db.insertReporte(reporte);

    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Reporte $folio creado')),
    );
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Nuevo Reporte'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: '1. Datos\nGenerales'),
            Tab(text: '2. Inmueble\nafectado'),
            Tab(text: '3. Evaluación\nde daños'),
            Tab(text: '4. Condición\nde seguridad'),
            Tab(text: '5. Observaciones\nadicionales'),
            Tab(text: '6. Fotografías'),
          ],
        ),
      ),
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildTab1(),
                  _buildTab2(),
                  _buildTab3(),
                  _buildTab4(),
                  _buildTab5(),
                  _buildTab6(),
                ],
              ),
            ),
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    if (_tabController.index > 0)
                      OutlinedButton(
                        onPressed: () => _tabController.animateTo(_tabController.index - 1),
                        child: const Text('Anterior'),
                      ),
                    const Spacer(),
                    if (_tabController.index < 5)
                      FilledButton(
                        onPressed: () => _tabController.animateTo(_tabController.index + 1),
                        child: const Text('Siguiente'),
                      )
                    else
                      FilledButton.icon(
                        onPressed: _guardar,
                        icon: const Icon(Icons.save),
                        label: const Text('Guardar Reporte'),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTab1() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('1. Datos Generales',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _nombreCapturistaCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Nombre del capturista',
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) =>
                      v == null || v.trim().isEmpty ? 'Requerido' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _areaCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Área a la que pertenece',
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) =>
                      v == null || v.trim().isEmpty ? 'Requerido' : null,
                ),
                const SizedBox(height: 12),
                Text(
                  'Fecha y hora: ${DateFormat('dd/MM/yyyy HH:mm').format(DateTime.now())}',
                  style: TextStyle(color: Colors.grey[600]),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTab2() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('2. Información del inmueble afectado',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: _obteniendoUbicacion ? null : _obtenerUbicacion,
                  icon: _obteniendoUbicacion
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.gps_fixed),
                  label: Text(_lat != null
                      ? '${_lat!.toStringAsFixed(5)}, ${_lng!.toStringAsFixed(5)}'
                      : 'Obtener coordenadas'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _calleNumeroCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Calle y Número',
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) =>
                      v == null || v.trim().isEmpty ? 'Requerido' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _coloniaCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Colonia',
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) =>
                      v == null || v.trim().isEmpty ? 'Requerido' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _alcaldiaCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Alcaldía',
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) =>
                      v == null || v.trim().isEmpty ? 'Requerido' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _codigoPostalCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Código Postal',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.number,
                  maxLength: 5,
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
                const Text('2.1 Uso del Inmueble',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                const SizedBox(height: 12),
                ..._usos.map((u) => RadioListTile<String>(
                      title: Text(_usosLabel[u]!),
                      value: u,
                      groupValue: _usoInmueble,
                      onChanged: (v) => setState(() => _usoInmueble = v!),
                      contentPadding: EdgeInsets.zero,
                      dense: true,
                    )),
                if (_usoInmueble == 'otro') ...[
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _otroUsoCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Especifique otro uso',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                TextFormField(
                  controller: _fechaConstruccionCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Fecha aproximada de construcción',
                    hintText: 'Ej: 1995',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  initialValue: _numeroNiveles.toString(),
                  decoration: const InputDecoration(
                    labelText: 'Número de niveles',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.number,
                  onChanged: (v) =>
                      _numeroNiveles = int.tryParse(v) ?? 1,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTab3() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('3. Evaluación preliminar de daños',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                const SizedBox(height: 8),
                const Text('Selecciona el tipo de daño observado:'),
                const SizedBox(height: 12),
                ..._danos.map(
                  (d) => CheckboxListTile(
                    title: Text(_danosLabel[d]!),
                    value: _danosSeleccionados.contains(d),
                    onChanged: (v) {
                      setState(() {
                        if (v == true) {
                          _danosSeleccionados.add(d);
                        } else {
                          _danosSeleccionados.remove(d);
                        }
                      });
                    },
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTab4() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('4. Condición de seguridad',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                const SizedBox(height: 16),
                ..._condiciones.map(
                  (c) => RadioListTile<String>(
                    title: Text(_condLabel[c]!),
                    value: c,
                    groupValue: _condicionSeguridad,
                    onChanged: (v) =>
                        setState(() => _condicionSeguridad = v!),
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTab5() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('5. Observaciones adicionales',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _observacionesCtrl,
                  decoration: const InputDecoration(
                    hintText: 'Escribe observaciones adicionales...',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 8,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTab6() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('6. Fotografías',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                const SizedBox(height: 12),
                const Text(
                  'Función de captura próximamente disponible',
                  style: TextStyle(color: Colors.grey),
                ),
                if (_fotos.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _fotos
                        .map((f) => Chip(
                              label: Text(f),
                              onDeleted: () =>
                                  setState(() => _fotos.remove(f)),
                            ))
                        .toList(),
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}
