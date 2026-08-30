import 'dart:io';
import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import '../services/database_service.dart';
import '../services/auth_service.dart';
import '../models/inmueble_padron.dart';
import '../models/reporte_seguimiento.dart';
import '../models/caracteristica_tipo.dart';

class ReporteSeguimientoScreen extends StatefulWidget {
  final InmueblePadron inmueblePadron;
  const ReporteSeguimientoScreen({super.key, required this.inmueblePadron});

  @override
  State<ReporteSeguimientoScreen> createState() =>
      _ReporteSeguimientoScreenState();
}

class _ReporteSeguimientoScreenState extends State<ReporteSeguimientoScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _db = DatabaseService();
  final _uuid = const Uuid();

  late TabController _tabController;
  final _observacionesCtrl = TextEditingController();
  final _nombreCapturistaCtrl = TextEditingController();

  final Map<String, dynamic> _valoresCaracteristica = {};
  final Map<String, TextEditingController> _textControllers = {};

  List<CaracteristicaTipo> _caracteristicas = [];
  bool _cargandoCaracts = true;
  bool _guardando = false;

  DateTime _fechaSeleccionada = DateTime.now();
  final List<String> _fotos = [];
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _cargarDatos();
  }

  Future<void> _cargarDatos() async {
    final auth = AuthService();
    final nombre = await auth.getUserNombre();
    if (!mounted) return;
    _nombreCapturistaCtrl.text = nombre;

    final tipos = await _db.getTiposInmueble(soloActivos: true);
    if (!mounted) return;
    if (tipos.isNotEmpty) {
      final caracts = await _db.getCaracteristicas(tipos.first.id);
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
    _observacionesCtrl.dispose();
    _nombreCapturistaCtrl.dispose();
    for (final ctrl in _textControllers.values) {
      ctrl.dispose();
    }
    super.dispose();
  }

  Future<void> _guardar() async {
    if (_guardando) return;
    setState(() => _guardando = true);

    try {
      final reporteId = _uuid.v4();
      final reporte = ReporteSeguimiento(
        id: reporteId,
        inmueblePadronId: widget.inmueblePadron.id,
        capturista: _nombreCapturistaCtrl.text,
        fecha: _fechaSeleccionada,
        observaciones: _observacionesCtrl.text,
        fotos: _fotos.join(','),
      );

      await _db.insertReporteSeguimiento(reporte);

      final valores = _buildValores(reporteId);
      if (valores.isNotEmpty) {
        for (final v in valores) {
          await _db.insertValoresCaracteristica([v]);
        }
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
              'Reporte de seguimiento creado para ${widget.inmueblePadron.nombre}'),
          backgroundColor: Colors.green,
        ),
      );
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error al guardar: $e'), backgroundColor: Colors.red),
      );
    } finally {
      setState(() => _guardando = false);
    }
  }

  List<dynamic> _buildValores(String reporteId) {
    return _caracteristicas.where((c) {
      final val = _valoresCaracteristica[c.id];
      if (val == null) return false;
      if (val is String && val.isEmpty) return false;
      if (val is Set && val.isEmpty) return false;
      return true;
    }).map((c) {
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
          break;
        case 'multiseleccion':
          final set = raw as Set<String>?;
          valorSeleccion = set?.join(', ') ?? '';
          break;
        case 'date':
          valorTexto = raw as String?;
          break;
      }

      return {
        'id': _uuid.v4(),
        'reporteId': reporteId,
        'caracteristicaId': c.id,
        'valorTexto': valorTexto,
        'valorNumero': valorNumero,
        'valorBooleano': valorBooleano,
        'valorSeleccion': valorSeleccion,
      };
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Seguimiento: ${widget.inmueblePadron.nombre}'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: '1. Datos'),
            Tab(text: '2. Ubicación'),
            Tab(text: '3. Estado'),
            Tab(text: '4. Observaciones'),
            Tab(text: '5. Fotos'),
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
                        onPressed: () => _tabController
                            .animateTo(_tabController.index - 1),
                        child: const Text('Anterior'),
                      ),
                    const Spacer(),
                    if (_tabController.index < 4)
                      FilledButton(
                        onPressed: () => _tabController
                            .animateTo(_tabController.index + 1),
                        child: const Text('Siguiente'),
                      )
                    else
                      FilledButton.icon(
                        onPressed: _guardando ? null : _guardar,
                        icon: _guardando
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                    strokeWidth: 2, color: Colors.white))
                            : const Icon(Icons.save),
                        label: Text(
                            _guardando ? 'Guardando...' : 'Guardar Reporte'),
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
                const Text('1. Datos del Reporte',
                    style:
                        TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _nombreCapturistaCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Nombre del capturista',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                InkWell(
                  onTap: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: _fechaSeleccionada,
                      firstDate: DateTime(2020),
                      lastDate: DateTime.now(),
                      locale: const Locale('es', 'MX'),
                    );
                    if (picked != null) {
                      setState(() => _fechaSeleccionada = picked);
                    }
                  },
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
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('2. Ubicación del Inmueble',
                    style:
                        TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                const SizedBox(height: 12),
                _infoRow('Nombre', widget.inmueblePadron.nombre),
                _infoRow('Dirección', widget.inmueblePadron.direccion),
                _infoRow('Colonia', widget.inmueblePadron.colonia),
                _infoRow('Alcaldía', widget.inmueblePadron.alcaldia),
                _infoRow('Código Postal', widget.inmueblePadron.codigoPostal),
                _infoRow('Entre calles', widget.inmueblePadron.entreCalles),
                _infoRow('Coordenadas',
                    '${widget.inmueblePadron.lat?.toStringAsFixed(5) ?? 'N/A'}, ${widget.inmueblePadron.lng?.toStringAsFixed(5) ?? 'N/A'}'),
                const Divider(height: 24),
                const Text('Características',
                    style:
                        TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                const SizedBox(height: 8),
                _infoRow('Uso', widget.inmueblePadron.usoInmueble),
                _infoRow('Niveles', '${widget.inmueblePadron.niveles}'),
                _infoRow('Sótanos', '${widget.inmueblePadron.sotanos}'),
                _infoRow('Década construcción', widget.inmueblePadron.decadaConstruccion),
                _infoRow('Tipo inspección', widget.inmueblePadron.tipoInspeccion),
                _infoRow('Persona contactada', widget.inmueblePadron.personaContactada),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 140,
            child: Text(label,
                style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
          ),
          Expanded(
            child: Text(value.isNotEmpty ? value : '—',
                style: const TextStyle(fontSize: 13)),
          ),
        ],
      ),
    );
  }

  Widget _buildTab3() {
    final caractsEstado =
        _caracteristicas.where((c) => c.orden >= 20 && c.orden <= 40).toList();
    final caractsClasificacion =
        _caracteristicas.where((c) => c.orden >= 40 && c.orden <= 50).toList();
    final caractsRecomendaciones =
        _caracteristicas.where((c) => c.orden >= 50 && c.orden <= 60).toList();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (_cargandoCaracts)
          const Center(child: CircularProgressIndicator())
        else ...[
          if (caractsEstado.isNotEmpty)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('3. Estado de la Edificación',
                        style: TextStyle(
                            fontWeight: FontWeight.w600, fontSize: 16)),
                    const SizedBox(height: 8),
                    ...caractsEstado.map((c) => _buildCampoDinamico(c)),
                  ],
                ),
              ),
            ),
          if (caractsClasificacion.isNotEmpty) ...[
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Clasificación Global',
                        style: TextStyle(
                            fontWeight: FontWeight.w600, fontSize: 14)),
                    const SizedBox(height: 8),
                    ...caractsClasificacion.map((c) => _buildCampoDinamico(c)),
                  ],
                ),
              ),
            ),
          ],
          if (caractsRecomendaciones.isNotEmpty) ...[
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('4. Recomendaciones',
                        style: TextStyle(
                            fontWeight: FontWeight.w600, fontSize: 14)),
                    const SizedBox(height: 8),
                    ...caractsRecomendaciones.map((c) => _buildCampoDinamico(c)),
                  ],
                ),
              ),
            ),
          ],
          if (caractsEstado.isEmpty &&
              caractsClasificacion.isEmpty &&
              caractsRecomendaciones.isEmpty)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: Text('Sin características configuradas',
                    style: TextStyle(color: Colors.grey)),
              ),
            ),
        ],
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
                const Text('5. Observaciones',
                    style:
                        TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _observacionesCtrl,
                  decoration: const InputDecoration(
                    hintText: 'Escribe observaciones adicionales...',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 8,
                  maxLength: 200,
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
                const Text('6. Fotografías (incluyendo fachada)',
                    style:
                        TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                const SizedBox(height: 8),
                const Text('Máximo 10 imágenes',
                    style: TextStyle(color: Colors.grey, fontSize: 12)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    FilledButton.tonalIcon(
                      onPressed: _fotos.length >= 10
                          ? null
                          : () => _tomarFoto(ImageSource.camera),
                      icon: const Icon(Icons.camera_alt),
                      label: const Text('Cámara'),
                    ),
                    const SizedBox(width: 12),
                    FilledButton.tonalIcon(
                      onPressed: _fotos.length >= 10
                          ? null
                          : () => _tomarFoto(ImageSource.gallery),
                      icon: const Icon(Icons.photo_library),
                      label: const Text('Galería'),
                    ),
                  ],
                ),
                if (_fotos.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Text('Fotos capturadas (${_fotos.length}/10)',
                      style: const TextStyle(fontWeight: FontWeight.w500)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _fotos
                        .asMap()
                        .entries
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
      if (xfile != null) {
        setState(() => _fotos.add(xfile.path));
      }
    } catch (e) {
      if (!mounted) return;
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
                      fontWeight: FontWeight.w500, fontSize: 13)),
              const SizedBox(height: 4),
              ...c.opciones.map((o) => RadioListTile<String>(
                    title: Text(o, style: const TextStyle(fontSize: 13)),
                    value: o,
                    groupValue: seleccion,
                    onChanged: (v) {
                      setState(() => _valoresCaracteristica[c.id] = v);
                    },
                    contentPadding: EdgeInsets.zero,
                    dense: true,
                  )),
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
                      fontWeight: FontWeight.w500, fontSize: 13)),
              const SizedBox(height: 4),
              ...c.opciones.map((o) => CheckboxListTile(
                    title: Text(o, style: const TextStyle(fontSize: 13)),
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
