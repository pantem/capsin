import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../services/database_service.dart';
import '../models/tipo_inmueble.dart';
import '../models/caracteristica_tipo.dart';

class FormTipoScreen extends StatefulWidget {
  final TipoInmueble? tipo;

  const FormTipoScreen({super.key, this.tipo});

  @override
  State<FormTipoScreen> createState() => _FormTipoScreenState();
}

class _FormTipoScreenState extends State<FormTipoScreen> {
  final _formKey = GlobalKey<FormState>();
  final _db = DatabaseService();
  final _uuid = const Uuid();

  late final TextEditingController _nombreCtrl;
  late final TextEditingController _descCtrl;
  List<CaracteristicaTipo> _caracteristicas = [];
  bool _editando = false;

  @override
  void initState() {
    super.initState();
    _nombreCtrl = TextEditingController(text: widget.tipo?.nombre ?? '');
    _descCtrl = TextEditingController(text: widget.tipo?.descripcion ?? '');
    _editando = widget.tipo != null;
    if (_editando) _cargarCaracteristicas();
  }

  Future<void> _cargarCaracteristicas() async {
    final data = await _db.getCaracteristicas(widget.tipo!.id);
    setState(() => _caracteristicas = data);
  }

  Future<void> _guardar() async {
    if (!_formKey.currentState!.validate()) return;

    final id = widget.tipo?.id ?? _uuid.v4();
    final tipo = TipoInmueble(
      id: id,
      nombre: _nombreCtrl.text.trim(),
      descripcion: _descCtrl.text.trim(),
      activo: widget.tipo?.activo ?? true,
    );

    if (_editando) {
      await _db.updateTipoInmueble(tipo);
    } else {
      await _db.insertTipoInmueble(tipo);
    }

    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(_editando ? 'Tipo actualizado' : 'Tipo creado')),
    );
    Navigator.pop(context);
  }

  void _agregarCaracteristica() {
    final c = CaracteristicaTipo(
      id: _uuid.v4(),
      tipoInmuebleId: widget.tipo?.id ?? '',
      nombre: '',
      tipoDato: 'texto',
      requerido: false,
      orden: _caracteristicas.length,
    );
    _editarCaracteristica(c);
  }

  void _editarCaracteristica(CaracteristicaTipo c) {
    final nombreCtrl = TextEditingController(text: c.nombre);
    String tipoDato = c.tipoDato;
    final opcionesCtrl = TextEditingController(text: c.opciones.join('\n'));
    bool requerido = c.requerido;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDlgState) => AlertDialog(
          title: Text(c.nombre.isEmpty ? 'Nueva Característica' : 'Editar Característica'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nombreCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Nombre',
                    hintText: 'Ej: Material predominante',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: tipoDato,
                  decoration: const InputDecoration(
                    labelText: 'Tipo de dato',
                    border: OutlineInputBorder(),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'texto', child: Text('Texto')),
                    DropdownMenuItem(value: 'numero', child: Text('Número')),
                    DropdownMenuItem(value: 'booleano', child: Text('Sí/No')),
                    DropdownMenuItem(value: 'seleccion', child: Text('Selección')),
                  ],
                  onChanged: (v) => setDlgState(() => tipoDato = v ?? 'texto'),
                ),
                if (tipoDato == 'seleccion') ...[
                  const SizedBox(height: 12),
                  TextField(
                    controller: opcionesCtrl,
                    decoration: const InputDecoration(
                      labelText: 'Opciones (una por línea)',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 4,
                  ),
                ],
                const SizedBox(height: 12),
                SwitchListTile(
                  title: const Text('Requerido'),
                  value: requerido,
                  onChanged: (v) => setDlgState(() => requerido = v),
                  contentPadding: EdgeInsets.zero,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancelar'),
            ),
            FilledButton(
              onPressed: () async {
                if (nombreCtrl.text.trim().isEmpty) return;
                final opciones = tipoDato == 'seleccion'
                    ? opcionesCtrl.text.split('\n').map((s) => s.trim()).where((s) => s.isNotEmpty).toList()
                    : <String>[];
                final updated = CaracteristicaTipo(
                  id: c.id,
                  tipoInmuebleId: _editando ? widget.tipo!.id : c.tipoInmuebleId,
                  nombre: nombreCtrl.text.trim(),
                  tipoDato: tipoDato,
                  opciones: opciones,
                  requerido: requerido,
                  orden: c.orden,
                );
                if (_editando) {
                  await _db.insertCaracteristica(updated);
                }
                Navigator.pop(ctx);
                _cargarCaracteristicas();
              },
              child: const Text('Guardar'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _nombreCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_editando ? 'Editar Tipo' : 'Nuevo Tipo'),
      ),
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
                    const Text('Información del tipo',
                        style: TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _nombreCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Nombre',
                        hintText: 'Ej: Casa, Edificio, Local',
                        border: OutlineInputBorder(),
                      ),
                      validator: (v) => v == null || v.trim().isEmpty ? 'Requerido' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _descCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Descripción',
                        border: OutlineInputBorder(),
                      ),
                      maxLines: 2,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Características (${_caracteristicas.length})',
                    style: const TextStyle(fontWeight: FontWeight.w600)),
                if (_editando)
                  TextButton.icon(
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('Agregar'),
                    onPressed: _agregarCaracteristica,
                  ),
              ],
            ),
            const SizedBox(height: 8),
            if (!_editando)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('Guarda el tipo primero para agregar características',
                      style: TextStyle(color: Colors.grey)),
                ),
              )
            else if (_caracteristicas.isEmpty)
              const Card(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('Sin características definidas',
                      style: TextStyle(color: Colors.grey)),
                ),
              )
            else
              ..._caracteristicas.map((c) => Card(
                    margin: const EdgeInsets.only(bottom: 4),
                    child: ListTile(
                      dense: true,
                      title: Text(c.nombre),
                      subtitle: Text(
                        '${_labelTipoDato(c.tipoDato)}${c.requerido ? ' · Requerido' : ''}',
                        style: const TextStyle(fontSize: 12),
                      ),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.edit, size: 18),
                            onPressed: () => _editarCaracteristica(c),
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete_outline, size: 18, color: Colors.red),
                            onPressed: () async {
                              await _db.deleteCaracteristica(c.id);
                              _cargarCaracteristicas();
                            },
                          ),
                        ],
                      ),
                    ),
                  )),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _guardar,
              icon: const Icon(Icons.save),
              label: Text(_editando ? 'Guardar Cambios' : 'Crear Tipo'),
            ),
          ],
        ),
      ),
    );
  }

  String _labelTipoDato(String td) {
    switch (td) {
      case 'texto':
        return 'Texto';
      case 'numero':
        return 'Número';
      case 'booleano':
        return 'Sí/No';
      case 'seleccion':
        return 'Selección';
      default:
        return td;
    }
  }
}
