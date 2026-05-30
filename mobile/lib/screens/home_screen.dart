import 'package:flutter/material.dart';
import '../services/database_service.dart';
import '../models/siniestro.dart';
import '../services/sync_service.dart';
import 'nuevo_siniestro_screen.dart';
import 'detalle_siniestro_screen.dart';
import 'admin_tipos_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final DatabaseService _db = DatabaseService();
  List<Siniestro> _siniestros = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    setState(() => _loading = true);
    final data = await _db.getSiniestros();
    setState(() {
      _siniestros = data;
      _loading = false;
    });
  }

  Future<void> _sincronizar() async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );
    final result = await SyncService().sincronizar();
    if (!context.mounted) return;
    Navigator.of(context).pop();
    await _cargar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(result.mensaje)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Siniestros Sismo'),
        actions: [
          IconButton(
            icon: const Icon(Icons.sync),
            onPressed: _sincronizar,
            tooltip: 'Sincronizar',
          ),
          IconButton(
            icon: const Icon(Icons.admin_panel_settings),
            onPressed: () async {
              await Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AdminTiposScreen()),
              );
              _cargar();
            },
            tooltip: 'Administrar',
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _siniestros.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.map_outlined, size: 80, color: Colors.grey),
                      SizedBox(height: 16),
                      Text('No hay reportes capturados',
                          style: TextStyle(color: Colors.grey, fontSize: 16)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _cargar,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _siniestros.length,
                    itemBuilder: (_, i) {
                      final s = _siniestros[i];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          title: Text(s.folio,
                              style: const TextStyle(fontWeight: FontWeight.bold)),
                          subtitle: Text(
                            '${s.direccion}\n${s.municipio}',
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (!s.sincronizado)
                                const Icon(Icons.cloud_off, size: 18, color: Colors.grey),
                              IconButton(
                                icon: const Icon(Icons.delete_outline, color: Colors.red),
                                onPressed: () async {
                                  await _db.deleteSiniestro(s.id);
                                  _cargar();
                                },
                              ),
                            ],
                          ),
                          onTap: () async {
                            await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => DetalleSiniestroScreen(siniestroId: s.id),
                              ),
                            );
                            _cargar();
                          },
                        ),
                      );
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const NuevoSiniestroScreen()),
          );
          _cargar();
        },
        icon: const Icon(Icons.add),
        label: const Text('Nuevo Reporte'),
      ),
    );
  }
}
