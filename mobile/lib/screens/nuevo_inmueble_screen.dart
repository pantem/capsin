import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../services/database_service.dart';
import '../models/inmueble.dart';
import '../models/tipo_inmueble.dart';
import '../models/caracteristica_tipo.dart';
import '../models/valor_caracteristica.dart';

class NuevoInmuebleScreen extends StatefulWidget {
  final String siniestroId;
  final String? padreId;

  const NuevoInmuebleScreen({
    super.key,
    required this.siniestroId,
    this.padreId,
  });

  @override
  State<NuevoInmuebleScreen> createState() => _NuevoInmuebleScreenState();
}

class _NuevoInmuebleScreenState extends State<NuevoInmuebleScreen> {
  final _formKey = GlobalKey<FormState>();
  final _db = DatabaseService();
  final _uuid = const Uuid();

  String? _tipoInmuebleId;
  TipoInmueble? _tipoSeleccionado;
  List<TipoInmueble> _tiposDisponibles = [];
  List<CaracteristicaTipo> _caracteristicas = [];
  final Map<String, dynamic> _valoresCaracteristica = {};
  bool _cargandoTipos = true;

  String _tipo = '';
  int _numeroNiveles = 1;
  String _tipoUnidad = '';
  String _identificador = '';
  String _estadoAfectacion = 'sin_daños';
  final _observacionesCtrl = TextEditingController();
  bool _esPadre = false;

  bool get _esHijo => widget.padreId != null;

  @override
  void initState() {
    super.initState();
    _cargarTipos();
  }

  Future<void> _cargarTipos() async {
    final tipos = await _db.getTiposInmueble(soloActivos: true);
    setState(() {
      _tiposDisponibles = tipos;
      _cargandoTipos = false;
    });
  }

  Future<void> _onTipoChanged(String? id) async {
    if (id == null) {
      setState(() {
        _tipoInmuebleId = null;
        _tipoSeleccionado = null;
        _caracteristicas = [];
        _valoresCaracteristica.clear();
        _tipo = '';
      });
      return;
    }
    final tipo = _tiposDisponibles.firstWhere((t) => t.id == id);
    final caracteristicas = await _db.getCaracteristicas(id);
    setState(() {
      _tipoInmuebleId = id;
      _tipoSeleccionado = tipo;
      _caracteristicas = caracteristicas;
      _tipo = tipo.nombre;
      _valoresCaracteristica.clear();
    });
  }

  Future<void> _guardar() async {
    if (!_formKey.currentState!.validate()) return;

    final inmuebleId = _uuid.v4();
    final inmueble = Inmueble(
      id: inmuebleId,
      siniestroId: widget.siniestroId,
      tipo: _tipo,
      tipoInmuebleId: _tipoInmuebleId,
      numeroNiveles: _numeroNiveles,
      tipoUnidad: _tipoUnidad,
      esPadre: _esPadre,
      padreId: widget.padreId,
      identificador: _identificador,
      estadoAfectacion: _estadoAfectacion,
      observaciones: _observacionesCtrl.text,
    );

    await _db.insertInmueble(inmueble);

    if (_caracteristicas.isNotEmpty) {
      final valores = _caracteristicas.map((c) {
        final raw = _valoresCaracteristica[c.id];
        return ValorCaracteristica(
          id: _uuid.v4(),
          inmuebleId: inmuebleId,
          caracteristicaId: c.id,
          valorTexto: c.tipoDato == 'texto' ? raw as String? : null,
          valorNumero: c.tipoDato == 'numero' ? (raw as num?)?.toDouble() : null,
          valorBooleano: c.tipoDato == 'booleano' ? raw as bool? : null,
          valorSeleccion: c.tipoDato == 'seleccion' ? raw as String? : null,
        );
      }).toList();
      await _db.insertValoresCaracteristica(valores);
    }

    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Inmueble registrado')),
    );
    Navigator.pop(context);
  }

  @override
  void dispose() {
    _observacionesCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_esHijo ? 'Nuevo Departamento' : 'Nuevo Inmueble'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (!_esHijo) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Tipo de Inmueble',
                          style: TextStyle(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      _cargandoTipos
                          ? const LinearProgressIndicator()
                          : _tiposDisponibles.isEmpty
                              ? Text('No hay tipos disponibles. Crea uno en la administración.',
                                  style: TextStyle(color: Colors.grey[600]))
                              : DropdownButtonFormField<String>(
                                  value: _tipoInmuebleId,
                                  decoration: const InputDecoration(
                                    hintText: 'Seleccionar tipo',
                                    border: OutlineInputBorder(),
                                  ),
                                  items: _tiposDisponibles
                                      .map((t) => DropdownMenuItem(
                                          value: t.id, child: Text(t.nombre)))
                                      .toList(),
                                  onChanged: _onTipoChanged,
                                  validator: (_) => _tipoInmuebleId == null && !_esHijo
                                      ? 'Selecciona un tipo'
                                      : null,
                                ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              if (_tipoSeleccionado != null && _tipoSeleccionado!.descripcion.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(_tipoSeleccionado!.descripcion,
                      style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                ),
            ],
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Identificación',
                        style: TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    TextFormField(
                      initialValue: _identificador,
                      decoration: InputDecoration(
                        labelText: _esHijo ? 'N° Departamento' : 'Identificador',
                        hintText: 'Ej: Edificio A, Casa 3',
                        border: const OutlineInputBorder(),
                      ),
                      onChanged: (v) => _identificador = v,
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            initialValue: _numeroNiveles.toString(),
                            decoration: const InputDecoration(
                              labelText: 'Número de niveles',
                              border: OutlineInputBorder(),
                            ),
                            keyboardType: TextInputType.number,
                            onChanged: (v) =>
                                _numeroNiveles = int.tryParse(v) ?? 1,
                          ),
                        ),
                        if (!_esHijo) ...[
                          const SizedBox(width: 12),
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              value: _tipoUnidad.isNotEmpty ? _tipoUnidad : null,
                              decoration: const InputDecoration(
                                labelText: 'Tipo unidad',
                                border: OutlineInputBorder(),
                              ),
                              items: const [
                                DropdownMenuItem(value: '', child: Text('Seleccionar')),
                                DropdownMenuItem(value: 'vivienda', child: Text('Vivienda')),
                                DropdownMenuItem(value: 'oficina', child: Text('Oficina')),
                              ],
                              onChanged: (v) => _tipoUnidad = v ?? '',
                            ),
                          ),
                        ],
                      ],
                    ),
                    if (!_esHijo) ...[
                      const SizedBox(height: 12),
                      SwitchListTile(
                        title: const Text('¿Tiene departamentos/unidades?'),
                        subtitle: const Text('Registrar inmueble como padre'),
                        value: _esPadre,
                        onChanged: (v) => setState(() => _esPadre = v),
                        contentPadding: EdgeInsets.zero,
                      ),
                    ],
                  ],
                ),
              ),
            ),
            if (_caracteristicas.isNotEmpty) ...[
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Características (${_tipoSeleccionado?.nombre ?? ""})',
                          style: const TextStyle(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 12),
                      ..._caracteristicas.map((c) => _buildCaracteristicaField(c)),
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 12),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Afectación',
                        style: TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    SegmentedButton<String>(
                      segments: const [
                        ButtonSegment(
                            value: 'sin_daños',
                            label: Text('Sin daños'),
                            icon: Icon(Icons.check_circle, color: Colors.green)),
                        ButtonSegment(
                            value: 'moderado',
                            label: Text('Moderado'),
                            icon: Icon(Icons.warning, color: Colors.orange)),
                        ButtonSegment(
                            value: 'critico',
                            label: Text('Crítico'),
                            icon: Icon(Icons.error, color: Colors.red)),
                      ],
                      selected: {_estadoAfectacion},
                      onSelectionChanged: (v) =>
                          setState(() => _estadoAfectacion = v.first),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _observacionesCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Observaciones',
                        border: OutlineInputBorder(),
                      ),
                      maxLines: 2,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _guardar,
              icon: const Icon(Icons.save),
              label: const Text('Guardar Inmueble'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCaracteristicaField(CaracteristicaTipo c) {
    final key = ValueKey(c.id);
    switch (c.tipoDato) {
      case 'texto':
        return Padding(
          key: key,
          padding: const EdgeInsets.only(bottom: 12),
          child: TextFormField(
            decoration: InputDecoration(
              labelText: c.nombre,
              border: const OutlineInputBorder(),
            ),
            validator: c.requerido
                ? (v) => v == null || v.isEmpty ? 'Requerido' : null
                : null,
            onChanged: (v) => _valoresCaracteristica[c.id] = v,
          ),
        );
      case 'numero':
        return Padding(
          key: key,
          padding: const EdgeInsets.only(bottom: 12),
          child: TextFormField(
            decoration: InputDecoration(
              labelText: c.nombre,
              border: const OutlineInputBorder(),
            ),
            keyboardType: TextInputType.number,
            validator: c.requerido
                ? (v) => v == null || v.isEmpty ? 'Requerido' : null
                : null,
            onChanged: (v) =>
                _valoresCaracteristica[c.id] = double.tryParse(v),
          ),
        );
      case 'booleano':
        return Padding(
          key: key,
          padding: const EdgeInsets.only(bottom: 4),
          child: SwitchListTile(
            title: Text(c.nombre),
            value: _valoresCaracteristica[c.id] as bool? ?? false,
            onChanged: (v) =>
                setState(() => _valoresCaracteristica[c.id] = v),
            contentPadding: EdgeInsets.zero,
          ),
        );
      case 'seleccion':
        return Padding(
          key: key,
          padding: const EdgeInsets.only(bottom: 12),
          child: DropdownButtonFormField<String>(
            value: _valoresCaracteristica[c.id] as String?,
            decoration: InputDecoration(
              labelText: c.nombre,
              border: const OutlineInputBorder(),
            ),
            items: [
              const DropdownMenuItem(value: null, child: Text('Seleccionar')),
              ...c.opciones.map((o) =>
                  DropdownMenuItem(value: o, child: Text(o))),
            ],
            validator: c.requerido
                ? (v) => v == null ? 'Requerido' : null
                : null,
            onChanged: (v) =>
                setState(() => _valoresCaracteristica[c.id] = v),
          ),
        );
      default:
        return const SizedBox.shrink();
    }
  }
}
