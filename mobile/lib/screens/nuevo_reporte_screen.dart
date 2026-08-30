import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:uuid/uuid.dart';
import 'package:intl/intl.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import '../config.dart';
import '../services/database_service.dart';
import '../services/auth_service.dart';
import '../models/reporte.dart';
import '../models/caracteristica_tipo.dart';
import '../models/tipo_inmueble.dart';
import '../models/valor_caracteristica.dart';

class NuevoReporteScreen extends StatefulWidget {
  final String? inmueblePadronId;
  const NuevoReporteScreen({super.key, this.inmueblePadronId});

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
  final _observacionesCtrl = TextEditingController();

  final Map<String, dynamic> _valoresCaracteristica = {};
  final Map<String, TextEditingController> _textControllers = {};

  double? _lat;
  double? _lng;
  bool _obteniendoUbicacion = false;
  bool _cargandoCaracts = true;

  DateTime _fechaSeleccionada = DateTime.now();

  final List<String> _fotos = [];
  final ImagePicker _picker = ImagePicker();
  String get _apiBase => AppConfig.apiBaseUrl;

  TipoInmueble? _tipoGenerico;
  List<CaracteristicaTipo> _caracteristicas = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 6, vsync: this);
    _cargarCaracteristicas();
    _cargarDatosUsuario();
  }

  Future<void> _cargarDatosUsuario() async {
    final auth = AuthService();
    final nombre = await auth.getUserNombre();
    final area = await auth.getUserArea();
    if (!mounted) return;
    setState(() {
      _nombreCapturistaCtrl.text = nombre;
      _areaCtrl.text = area;
    });
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
          } else if (c.tipoDato == 'date') {
            _valoresCaracteristica[c.id] =
                DateFormat('yyyy-MM-dd').format(DateTime.now());
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
      _lat = pos.latitude;
      _lng = pos.longitude;

      try {
        final geoUri = Uri.parse(
            'https://nominatim.openstreetmap.org/reverse?format=json&lat=$_lat&lon=$_lng&addressdetails=1');
        final geoResp = await http.get(geoUri, headers: {
          'User-Agent': 'SiniestrosSismoApp/1.0',
        });
        if (geoResp.statusCode == 200) {
          final geoData = jsonDecode(geoResp.body) as Map<String, dynamic>;
          final address = geoData['address'] as Map<String, dynamic>? ?? {};
          final road = (address['road'] as String? ?? '').trim();
          final houseNum = (address['house_number'] as String? ?? '').trim();
          final colonia = address['suburb'] as String? ??
              address['neighbourhood'] as String? ??
              address['hamlet'] as String? ??
              '';
          final alcaldia = address['city'] as String? ??
              address['town'] as String? ??
              address['municipality'] as String? ??
              '';
          final cp = (address['postcode'] as String? ?? '').trim();

          String calleNum = [road, houseNum].where((s) => s.isNotEmpty).join(' ');

          void _setCaractByNombre(String nombre, String valor) {
            for (final c in _caracteristicas) {
              if (c.nombre.contains(nombre) && _textControllers.containsKey(c.id)) {
                _textControllers[c.id]!.text = valor;
                break;
              }
            }
          }

          if (calleNum.isNotEmpty) _setCaractByNombre('Calle y Número', calleNum);
          if (colonia.isNotEmpty) _setCaractByNombre('Colonia', colonia);
          if (alcaldia.isNotEmpty) _setCaractByNombre('Alcaldía', alcaldia);
          if (cp.isNotEmpty) _setCaractByNombre('Código Postal', cp);
        }
      } catch (_) {}

      setState(() {});
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() => _obteniendoUbicacion = false);
    }
  }

  Future<void> _seleccionarFecha() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _fechaSeleccionada,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      locale: const Locale('es', 'MX'),
    );
    if (picked != null) setState(() => _fechaSeleccionada = picked);
  }

  Future<void> _guardar() async {
    if (!_formKey.currentState!.validate()) return;
    try {
      final folio =
          'SIS-${DateFormat('yyyyMMdd').format(_fechaSeleccionada)}-${_uuid.v4().substring(0, 4).toUpperCase()}';
      final reporteId = _uuid.v4();

      String _getCaractByNombre(String nombre) {
        for (final c in _caracteristicas) {
          if (c.nombre.contains(nombre) && _textControllers.containsKey(c.id)) {
            return _textControllers[c.id]!.text;
          }
        }
        return '';
      }

      final reporte = Reporte(
        id: reporteId,
        folio: folio,
        fecha: _fechaSeleccionada,
        nombreCapturista: _nombreCapturistaCtrl.text,
        area: _areaCtrl.text,
        calleNumero: _getCaractByNombre('Calle y Número'),
        colonia: _getCaractByNombre('Colonia'),
        alcaldia: _getCaractByNombre('Alcaldía'),
        codigoPostal: _getCaractByNombre('Código Postal'),
        lat: _lat,
        lng: _lng,
        usoInmueble: '',
        otroUso: null,
        fechaConstruccion: '',
        danosObservados: '',
        estadoAfectacion: '',
        sobreNivelBanqueta: 0,
        bajoNivelBanqueta: 0,
        condicionSeguridad: '',
        observaciones: _observacionesCtrl.text,
        fotos: _fotos.join(','),
      );

      await _db.insertReporte(reporte);
      await _db.insertValoresCaracteristica(_buildValores(reporteId));

      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Reporte $folio creado')),
      );
      Navigator.pop(context);
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error al guardar: $e')),
      );
    }
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
          valorNumero = double.tryParse(_textControllers[c.id]?.text ?? '');
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
        case 'date':
          valorTexto = raw as String?;
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
            Tab(text: '2. Inmueble\n(Padrón)'),
            Tab(text: '3. Estado\nEdificación'),
            Tab(text: '4. Clasificación\nGlobal'),
            Tab(text: '5. Recomendaciones'),
            Tab(text: '6. Fotos +\nObservaciones'),
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
                InkWell(
                  onTap: _seleccionarFecha,
                  child: InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'Fecha del reporte',
                      border: OutlineInputBorder(),
                      suffixIcon: Icon(Icons.calendar_today),
                    ),
                    child: Text(
                      DateFormat('dd-MM-yyyy').format(_fechaSeleccionada),
                      style: const TextStyle(fontSize: 16),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTab2() {
    final caractsTab2 = _caracteristicas
        .where((c) => c.orden >= 1 && c.orden <= 14)
        .toList();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('2. Información del inmueble',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: _obteniendoUbicacion ? null : _obtenerUbicacion,
                  icon: _obteniendoUbicacion
                      ? const SizedBox(
                          width: 18, height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.gps_fixed),
                  label: Text(_lat != null
                      ? '${_lat!.toStringAsFixed(5)}, ${_lng!.toStringAsFixed(5)}'
                      : 'Obtener coordenadas'),
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
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
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
    final caractsTab3 = _caracteristicas
        .where((c) => c.orden >= 20 && c.orden <= 40)
        .toList();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('3. Estado de la Edificación',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                const SizedBox(height: 8),
                if (caractsTab3.isEmpty && !_cargandoCaracts)
                  const Text('Sin características configuradas',
                      style: TextStyle(color: Colors.grey)),
                const SizedBox(height: 12),
                ...caractsTab3.map((c) => _buildCampoDinamico(c)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTab4() {
    final caractsTab4 = _caracteristicas
        .where((c) => c.orden >= 40 && c.orden <= 50)
        .toList();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('4. Clasificación Global',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                const SizedBox(height: 16),
                if (caractsTab4.isEmpty && !_cargandoCaracts)
                  const Text('Sin características configuradas',
                      style: TextStyle(color: Colors.grey)),
                ...caractsTab4.map((c) => _buildCampoDinamico(c)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTab5() {
    final caractsTab5 = _caracteristicas
        .where((c) => c.orden >= 50 && c.orden <= 60)
        .toList();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('5. Recomendaciones',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                const SizedBox(height: 16),
                if (caractsTab5.isEmpty && !_cargandoCaracts)
                  const Text('Sin características configuradas',
                      style: TextStyle(color: Colors.grey)),
                ...caractsTab5.map((c) => _buildCampoDinamico(c)),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTab6() {
    final caractsTab6 = _caracteristicas
        .where((c) => c.orden >= 60 && c.orden <= 70 && !c.nombre.contains('Fotograf'))
        .toList();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('6. Observaciones y Fotografías',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                const SizedBox(height: 12),
                ...caractsTab6.map((c) => _buildCampoDinamico(c)),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _observacionesCtrl,
                  decoration: const InputDecoration(
                    hintText: 'Observaciones adicionales...',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 4,
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
                const Text('Fotografías (incluyendo fachada)',
                    style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                const SizedBox(height: 4),
                const Text('Máximo 10 imágenes',
                    style: TextStyle(color: Colors.grey, fontSize: 12)),
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
                  Text('Fotos capturadas (${_fotos.length})',
                      style: const TextStyle(fontWeight: FontWeight.w500)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _fotos.asMap().entries
                        .map((e) => _buildFotoThumb(e.key, e.value))
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

  Future<void> _tomarFoto(ImageSource source) async {
    try {
      final xfile = await _picker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1920,
        imageQuality: 80,
      );
      if (xfile != null) setState(() => _fotos.add(xfile.path));
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
      case 'date':
        final fechaStr = _valoresCaracteristica[c.id] as String? ??
            DateFormat('yyyy-MM-dd').format(DateTime.now());
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: InkWell(
            onTap: () async {
              final picked = await showDatePicker(
                context: context,
                locale: const Locale('es', 'MX'),
                initialDate: DateTime.tryParse(fechaStr) ?? DateTime.now(),
                firstDate: DateTime(1900),
                lastDate: DateTime.now(),
              );
              if (picked != null) {
                setState(() {
                  _valoresCaracteristica[c.id] =
                      DateFormat('yyyy-MM-dd').format(picked);
                });
              }
            },
            child: InputDecorator(
              decoration: InputDecoration(
                labelText: c.nombre,
                border: const OutlineInputBorder(),
                suffixIcon: const Icon(Icons.calendar_today),
              ),
              child: Text(
                DateFormat('dd-MM-yyyy')
                    .format(DateTime.tryParse(fechaStr) ?? DateTime.now()),
                style: const TextStyle(fontSize: 16),
              ),
            ),
          ),
        );
      case 'seleccion':
        final seleccion = _valoresCaracteristica[c.id] as String?;
        final tieneOtro = c.opciones.contains('Otro');
        final usarDropdown = c.opciones.length > 5;
        if (usarDropdown) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: DropdownButtonFormField<String>(
              value: seleccion,
              decoration: InputDecoration(
                labelText: c.nombre,
                border: const OutlineInputBorder(),
              ),
              items: [
                const DropdownMenuItem<String>(
                  value: '',
                  child: Text('Seleccione', style: TextStyle(color: Colors.grey)),
                ),
                ...c.opciones.map((o) => DropdownMenuItem<String>(
                  value: o,
                  child: Text(o),
                )),
              ],
              onChanged: (v) => setState(() => _valoresCaracteristica[c.id] = v),
              validator: c.requerido
                  ? (v) => v == null || v.isEmpty ? 'Requerido' : null
                  : null,
            ),
          );
        }
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
        final seleccionados =
            _valoresCaracteristica[c.id] as Set<String>? ?? <String>{};
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
