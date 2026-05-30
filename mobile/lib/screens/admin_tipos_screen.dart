import 'package:flutter/material.dart';
import '../services/database_service.dart';
import '../models/tipo_inmueble.dart';
import 'form_tipo_screen.dart';

class AdminTiposScreen extends StatefulWidget {
  const AdminTiposScreen({super.key});

  @override
  State<AdminTiposScreen> createState() => _AdminTiposScreenState();
}

class _AdminTiposScreenState extends State<AdminTiposScreen> {
  final DatabaseService _db = DatabaseService();
  List<TipoInmueble> _tipos = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    setState(() => _loading = true);
    final data = await _db.getTiposInmueble();
    setState(() {
      _tipos = data;
      _loading = false;
    });
  }

  Future<void> _toggleActivo(TipoInmueble t) async {
    final updated = TipoInmueble(
      id: t.id,
      nombre: t.nombre,
      descripcion: t.descripcion,
      activo: !t.activo,
    );
    await _db.updateTipoInmueble(updated);
    _cargar();
  }

  Future<void> _eliminar(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Eliminar tipo'),
        content: const Text('¿Eliminar este tipo de inmueble y sus características?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancelar')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Eliminar')),
        ],
      ),
    );
    if (confirm == true) {
      await _db.deleteTipoInmueble(id);
      _cargar();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tipos de Inmueble'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _tipos.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.category_outlined, size: 80, color: Colors.grey),
                      SizedBox(height: 16),
                      Text('No hay tipos registrados',
                          style: TextStyle(color: Colors.grey, fontSize: 16)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: _tipos.length,
                  itemBuilder: (_, i) {
                    final t = _tipos[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: t.activo
                              ? Colors.green.withOpacity(0.2)
                              : Colors.grey.withOpacity(0.2),
                          child: Icon(
                            Icons.home_work,
                            color: t.activo ? Colors.green : Colors.grey,
                          ),
                        ),
                        title: Text(t.nombre,
                            style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(t.descripcion.isNotEmpty
                            ? t.descripcion
                            : 'Sin descripción'),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Switch(
                              value: t.activo,
                              onChanged: (_) => _toggleActivo(t),
                            ),
                            IconButton(
                              icon: const Icon(Icons.edit_outlined),
                              onPressed: () async {
                                await Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (_) => FormTipoScreen(tipo: t),
                                  ),
                                );
                                _cargar();
                              },
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, color: Colors.red),
                              onPressed: () => _eliminar(t.id),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const FormTipoScreen()),
          );
          _cargar();
        },
        icon: const Icon(Icons.add),
        label: const Text('Nuevo Tipo'),
      ),
    );
  }
}
