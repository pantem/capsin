import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../services/database_service.dart';
import '../models/damnificado.dart';

class NuevoDamnificadoScreen extends StatefulWidget {
  final String inmuebleId;

  const NuevoDamnificadoScreen({super.key, required this.inmuebleId});

  @override
  State<NuevoDamnificadoScreen> createState() => _NuevoDamnificadoScreenState();
}

class _NuevoDamnificadoScreenState extends State<NuevoDamnificadoScreen> {
  final _formKey = GlobalKey<FormState>();
  final _db = DatabaseService();
  final _uuid = const Uuid();

  final _nombreCtrl = TextEditingController();
  final _edadCtrl = TextEditingController();
  final _tipoIdCtrl = TextEditingController();
  final _numIdCtrl = TextEditingController();
  final _obsCtrl = TextEditingController();

  String _sexo = '';
  String _estado = 'ileso';
  bool _requiereTraslado = false;

  @override
  void dispose() {
    _nombreCtrl.dispose();
    _edadCtrl.dispose();
    _tipoIdCtrl.dispose();
    _numIdCtrl.dispose();
    _obsCtrl.dispose();
    super.dispose();
  }

  Future<void> _guardar() async {
    if (!_formKey.currentState!.validate()) return;

    final damnificado = Damnificado(
      id: _uuid.v4(),
      inmuebleId: widget.inmuebleId,
      nombre: _nombreCtrl.text,
      edad: int.tryParse(_edadCtrl.text) ?? 0,
      sexo: _sexo,
      tipoIdentificacion: _tipoIdCtrl.text,
      numeroIdentificacion: _numIdCtrl.text,
      estado: _estado,
      requiereTraslado: _requiereTraslado,
      observaciones: _obsCtrl.text,
    );

    await _db.insertDamnificado(damnificado);

    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Damnificado registrado')),
    );
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Registrar Damnificado')),
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
                    const Text('Datos personales', style: TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _nombreCtrl,
                      decoration: const InputDecoration(
                        labelText: 'Nombre completo',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _edadCtrl,
                            decoration: const InputDecoration(
                              labelText: 'Edad',
                              border: OutlineInputBorder(),
                            ),
                            keyboardType: TextInputType.number,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            value: _sexo.isNotEmpty ? _sexo : null,
                            decoration: const InputDecoration(
                              labelText: 'Sexo',
                              border: OutlineInputBorder(),
                            ),
                            items: const [
                              DropdownMenuItem(value: '', child: Text('Seleccionar')),
                              DropdownMenuItem(value: 'M', child: Text('Masculino')),
                              DropdownMenuItem(value: 'F', child: Text('Femenino')),
                            ],
                            onChanged: (v) => _sexo = v ?? '',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _tipoIdCtrl,
                            decoration: const InputDecoration(
                              labelText: 'Tipo ID',
                              hintText: 'INE, Pasaporte',
                              border: OutlineInputBorder(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextFormField(
                            controller: _numIdCtrl,
                            decoration: const InputDecoration(
                              labelText: 'Número ID',
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
                    const Text('Estado', style: TextStyle(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    SegmentedButton<String>(
                      segments: const [
                        ButtonSegment(value: 'ileso', label: Text('Ileso'), icon: Icon(Icons.check_circle, color: Colors.green)),
                        ButtonSegment(value: 'lesionado_leve', label: Text('Lesión leve'), icon: Icon(Icons.healing, color: Colors.orange)),
                        ButtonSegment(value: 'lesionado_grave', label: Text('Lesión grave'), icon: Icon(Icons.local_hospital, color: Colors.red)),
                        ButtonSegment(value: 'fallecido', label: Text('Fallecido'), icon: Icon(Icons.cancel, color: Colors.black54)),
                      ],
                      selected: {_estado},
                      onSelectionChanged: (v) => setState(() => _estado = v.first),
                    ),
                    const SizedBox(height: 12),
                    SwitchListTile(
                      title: const Text('Requiere traslado'),
                      value: _requiereTraslado,
                      onChanged: (v) => setState(() => _requiereTraslado = v),
                      contentPadding: EdgeInsets.zero,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _obsCtrl,
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
              label: const Text('Guardar Damnificado'),
            ),
          ],
        ),
      ),
    );
  }
}
