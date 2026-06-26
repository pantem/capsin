import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:uuid/uuid.dart';
import 'package:intl/intl.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import '../services/database_service.dart';
import '../models/reporte.dart';
import '../models/caracteristica_tipo.dart';
import '../models/tipo_inmueble.dart';
import '../models/valor_caracteristica.dart';

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

  final _nombreCapturistaCtrl = TextEditingController();
  final _areaCtrl = TextEditingController();
  final _calleNumeroCtrl = TextEditingController();
  final _coloniaCtrl = TextEditingController();
  final _alcaldiaCtrl = TextEditingController();
  final _codigoPostalCtrl = TextEditingController();
  final _observacionesCtrl = TextEditingController();

  final Map<String, dynamic> _valoresCaracteristica = {};
  final Map<String, TextEditingController> _textControllers = {};

  double? _lat;
  double? _lng;
  bool _obteniendoUbicacion = false;
  bool _cargandoCaracts = true;

  final List<String> _fotos = [];
  final ImagePicker _picker = ImagePicker();
  static const String _apiBase = 'https://capsin.onrender.com/api';

  List<Map<String, dynamic>> _colonias = [];
  bool _cargandoColonias = false;
  String? _coloniaSeleccionada;

  TipoInmueble? _tipoGenerico;
  List<CaracteristicaTipo> _caracteristicas = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 6, vsync: this);
    _cargarCaracteristicas();
  }

  Future<void> _cargarCaracteristicas() async {
    final tipos = await _db.getTiposInmueble(soloActivos: true);
    if (!mounted) return;
    if (tipos.isNotEmpty) {
      _tipoGenerico = tipos.first;
      final caracts = await _db.getCaracteristicas(_tipoGenerico!.id);
      setState(() {
        _caracteristicas = caracts;
        _cargandoCaracts = false;
        for (final c in caracts) {
          if (c.tipoDato == 'multiseleccion') {
            _valoresCaracteristica[c.id] = <String>{};
          } else if (c.tipoDato == 'booleano') {
            _valoresCaracteristica[c.id] = false;
          } else if (c.tipoDato == 'texto' || c.tipoDato == 'numero') {
            _textControllers[c.id] = TextEditingController();
          }
        }
      });
    } else {
      setState(() => _cargandoCaracts = false);
    }
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
    _observacionesCtrl.dispose();
    for (final ctrl in _textControllers.values) {
      ctrl.dispose();
    }
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

  Future<void> _buscarColonias(String cp) async {
    if (cp.length < 5) {
      setState(() {
        _colonias = [];
        _coloniaSeleccionada = null;
      });
      return;
    }
    setState(() => _cargandoColonias = true);
    try {
      final uri = Uri.parse('$_apiBase/codigos-postales?codigo=$cp');
      final response = await http.get(uri);
      if (response.statusCode == 200) {
        final data = (jsonDecode(response.body) as List)
            .cast<Map<String, dynamic>>();
        setState(() {
          _colonias = data;
          _coloniaSeleccionada = null;
          if (data.isNotEmpty) {
            if (data.length == 1) {
              _coloniaSeleccionada = data.first['colonia'] as String?;
              _coloniaCtrl.text = _coloniaSeleccionada!;
              _alcaldiaCtrl.text = data.first['municipio'] as String? ?? '';
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

  Future<void> _guardar() async {
    if (!_formKey.currentState!.validate()) return;

    final caractsRequeridas = _caracteristicas.where((c) => c.requerido);
    for (final c in caractsRequeridas) {
      if (c.tipoDato == 'seleccion') {
        final val = _valoresCaracteristica[c.id] as String?;
        if (val == null || val.isEmpty) {
          _tabController.animateTo(c.orden <= 2 ? 1 : c.orden == 3 ? 2 : 3);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Selecciona: ${c.nombre}')),
          );
          return;
        }
      } else if (c.tipoDato == 'multiseleccion') {
        final val = _valoresCaracteristica[c.id] as Set<String>?;
        if (val == null || val.isEmpty) {
          _tabController.animateTo(c.orden <= 2 ? 1 : c.orden == 3 ? 2 : 3);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Selecciona: ${c.nombre}')),
          );
          return;
        }
      } else if (c.tipoDato == 'texto' || c.tipoDato == 'numero') {
        final ctrl = _textControllers[c.id];
        if (ctrl == null || ctrl.text.trim().isEmpty) {
          _tabController.animateTo(c.orden <= 2 ? 1 : c.orden == 3 ? 2 : 3);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Completa: ${c.nombre}')),
          );
          return;
        }
      }
    }

    final folio =
        'SIS-${DateFormat('yyyyMMdd-HHmmss').format(DateTime.now())}-${_uuid.v4().substring(0, 4).toUpperCase()}';
    final reporteId = _uuid.v4();

    final reporte = Reporte(
      id: reporteId,
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
      usoInmueble: '',
      otroUso: null,
      fechaConstruccion: '',
      numeroNiveles: 1,
      danosObservados: '',
      condicionSeguridad: '',
      observaciones: _observacionesCtrl.text,
      fotos: _fotos.join(','),
    );

    await _db.insertReporte(reporte);
    await _db.insertValoresCaracteristica(
        _buildValores(reporteId));

    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Reporte $folio creado')),
    );
    Navigator.pop(context);
  }

  List<ValorCaracteristica> _buildValores(String reporteId) {
    return _caracteristicas.map((c) {
      final raw = _valoresCaracteristica[c.id];
      String? valorTexto;
      double? valorNumero;
      bool? valorBooleano;
      String? valorSeleccion;

      switch (c.tipoDato) {
        case 'texto':
          valorTexto = _textControllers[c.id]?.text;
          break;
        case 'numero':
          valorNumero =
              double.tryParse(_textControllers[c.id]?.text ?? '');
          break;
        case 'booleano':
          valorBooleano = raw as bool?;
          break;
        case 'seleccion':
          valorSeleccion = raw as String?;
          if (valorSeleccion == 'Otro') {
            valorTexto = _textControllers['${c.id}_otro']?.text;
          }
          break;
        case 'multiseleccion':
          final set = raw as Set<String>?;
          valorSeleccion = set?.join(', ') ?? '';
          break;
      }

      return ValorCaracteristica(
        id: _uuid.v4(),
        reporteId: reporteId,
        caracteristicaId: c.id,
        valorTexto: valorTexto,
        valorNumero: valorNumero,
        valorBooleano: valorBooleano,
        valorSeleccion: valorSeleccion,
      );
    }).toList();
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
                        onPressed: () =>
                            _tabController.animateTo(_tabController.index - 1),
                        child: const Text('Anterior'),
                      ),
                    const Spacer(),
                    if (_tabController.index < 5)
                      FilledButton(
                        onPressed: () =>
                            _tabController.animateTo(_tabController.index + 1),
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
    final caractsTab2 =
        _caracteristicas.where((c) => c.orden <= 2).toList();

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
                              child:
                                  CircularProgressIndicator(strokeWidth: 2),
                            ),
                          )
                        : null,
                  ),
                  keyboardType: TextInputType.number,
                  maxLength: 5,
                  onChanged: _buscarColonias,
                ),
                if (_colonias.length > 1 && _coloniaSeleccionada == null) ...[
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    decoration: const InputDecoration(
                      labelText: 'Selecciona la colonia',
                      border: OutlineInputBorder(),
                    ),
                    items: _colonias.map((c) => DropdownMenuItem(
                      value: c['colonia'] as String,
                      child: Text(c['colonia'] as String),
                    )).toList(),
                    onChanged: (v) {
                      setState(() {
                        _coloniaSeleccionada = v;
                        _coloniaCtrl.text = v ?? '';
                        final sel = _colonias.firstWhere(
                            (c) => c['colonia'] == v,
                            orElse: () => <String, dynamic>{});
                        if (sel.isNotEmpty) {
                          _alcaldiaCtrl.text =
                              sel['municipio'] as String? ?? '';
                        }
                      });
                    },
                  ),
                ],
                if (_coloniaSeleccionada != null && _colonias.length > 1) ...[
                  const SizedBox(height: 8),
                  Chip(
                    label: Text(_coloniaSeleccionada!),
                    onDeleted: () => setState(() {
                      _coloniaSeleccionada = null;
                      _colonias = [];
                      _codigoPostalCtrl.clear();
                    }),
                  ),
                ],
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
              ],
            ),
          ),
        ),
        if (caractsTab2.isNotEmpty) ...[
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('2.1 Características del Inmueble',
                      style: TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 14)),
                  const SizedBox(height: 12),
                  ...caractsTab2.map((c) => _buildCampoDinamico(c)),
                ],
              ),
            ),
          ),
        ],
        if (_cargandoCaracts)
          const Padding(
            padding: EdgeInsets.all(16),
            child: Center(child: CircularProgressIndicator()),
          ),
      ],
    );
  }

  Widget _buildTab3() {
    final caractsTab3 =
        _caracteristicas.where((c) => c.orden == 3).toList();

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
                if (caractsTab3.isEmpty)
                  const Text('Selecciona el tipo de daño observado:'),
                const SizedBox(height: 12),
                ...caractsTab3.map((c) => _buildCampoDinamico(c)),
                if (caractsTab3.isEmpty) ...[
                  const Text('Sin características configuradas',
                      style: TextStyle(color: Colors.grey)),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTab4() {
    final caractsTab4 =
        _caracteristicas.where((c) => c.orden == 4).toList();

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
                ...caractsTab4.map((c) => _buildCampoDinamico(c)),
                if (caractsTab4.isEmpty)
                  const Text('Sin características configuradas',
                      style: TextStyle(color: Colors.grey)),
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
                Row(
                  children: [
                    FilledButton.tonalIcon(
                      onPressed: () => _tomarFoto(ImageSource.camera),
                      icon: const Icon(Icons.camera_alt),
                      label: const Text('Cámara'),
                    ),
                    const SizedBox(width: 12),
                    FilledButton.tonalIcon(
                      onPressed: () => _tomarFoto(ImageSource.gallery),
                      icon: const Icon(Icons.photo_library),
                      label: const Text('Galería'),
                    ),
                  ],
                ),
                if (_fotos.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  const Text('Fotos capturadas (${_fotos.length})',
                      style: TextStyle(fontWeight: FontWeight.w500)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _fotos.asMap().entries.map((e) =>
                      _buildFotoThumb(e.key, e.value)
                    ).toList(),
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _tomarFoto(ImageSource source) async {
    try {
      final xfile = await _picker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 80,
      );
      if (xfile != null) {
        setState(() => _fotos.add(xfile.path));
      }
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error al capturar foto: $e')),
      );
    }
  }

  Widget _buildFotoThumb(int index, String path) {
    return Stack(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Image.file(
            File(path),
            width: 100,
            height: 100,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => Container(
              width: 100,
              height: 100,
              color: Colors.grey[200],
              child: const Icon(Icons.broken_image, color: Colors.grey),
            ),
          ),
        ),
        Positioned(
          top: 0,
          right: 0,
          child: GestureDetector(
            onTap: () => setState(() => _fotos.removeAt(index)),
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
              ),
              padding: const EdgeInsets.all(4),
              child: const Icon(Icons.close, size: 16, color: Colors.white),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCampoDinamico(CaracteristicaTipo c) {
    switch (c.tipoDato) {
      case 'texto':
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: TextFormField(
            controller: _textControllers[c.id],
            decoration: InputDecoration(
              labelText: c.nombre,
              border: const OutlineInputBorder(),
            ),
            validator: c.requerido
                ? (v) => v == null || v.isEmpty ? 'Requerido' : null
                : null,
          ),
        );
      case 'numero':
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: TextFormField(
            controller: _textControllers[c.id],
            decoration: InputDecoration(
              labelText: c.nombre,
              border: const OutlineInputBorder(),
            ),
            keyboardType: TextInputType.number,
            validator: c.requerido
                ? (v) => v == null || v.isEmpty ? 'Requerido' : null
                : null,
          ),
        );
      case 'booleano':
        return Padding(
          padding: const EdgeInsets.only(bottom: 4),
          child: SwitchListTile(
            title: Text(c.nombre),
            value: _valoresCaracteristica[c.id] as bool? ?? false,
            onChanged: (v) =>
                setState(() => _valoresCaracteristica[c.id] = v),
            contentPadding: EdgeInsets.zero,
            dense: true,
          ),
        );
      case 'seleccion':
        final seleccion = _valoresCaracteristica[c.id] as String?;
        final tieneOtro = c.opciones.contains('Otro');
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(c.nombre,
                  style: const TextStyle(
                      fontWeight: FontWeight.w500, fontSize: 14)),
              const SizedBox(height: 4),
              ...c.opciones.map((o) => RadioListTile<String>(
                    title: Text(o, style: const TextStyle(fontSize: 14)),
                    value: o,
                    groupValue: seleccion,
                    onChanged: (v) {
                      setState(() => _valoresCaracteristica[c.id] = v);
                      if (v == 'Otro' &&
                          !_textControllers.containsKey('${c.id}_otro')) {
                        _textControllers['${c.id}_otro'] =
                            TextEditingController();
                      }
                    },
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                  )),
              if (seleccion == 'Otro' && tieneOtro) ...[
                const SizedBox(height: 4),
                TextFormField(
                  controller: _textControllers['${c.id}_otro'],
                  decoration: const InputDecoration(
                    hintText: 'Especifique',
                    border: OutlineInputBorder(),
                  ),
                ),
              ],
            ],
          ),
        );
      case 'multiseleccion':
        final seleccionados = _valoresCaracteristica[c.id] as Set<String>? ??
            <String>{};
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(c.nombre,
                  style: const TextStyle(
                      fontWeight: FontWeight.w500, fontSize: 14)),
              const SizedBox(height: 4),
              ...c.opciones.map((o) => CheckboxListTile(
                    title: Text(o, style: const TextStyle(fontSize: 14)),
                    value: seleccionados.contains(o),
                    onChanged: (v) {
                      setState(() {
                        if (v == true) {
                          seleccionados.add(o);
                        } else {
                          seleccionados.remove(o);
                        }
                        _valoresCaracteristica[c.id] = seleccionados;
                      });
                    },
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                    controlAffinity: ListTileControlAffinity.leading,
                  )),
            ],
          ),
        );
      default:
        return const SizedBox.shrink();
    }
  }
}
