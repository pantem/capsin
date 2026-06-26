import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/registro.dart';
import '../services/database_service.dart';
import '../services/sync_service.dart';
import 'nuevo_registro_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _db = DatabaseService();
  final _sync = SyncService();
  List<Registro> _registros = [];
  bool _cargando = true;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    setState(() => _cargando = true);
    final lista = await _db.obtenerTodos();
    setState(() {
      _registros = lista;
      _cargando = false;
    });
  }

  Future<void> _sincronizar() async {
    final ok = await _sync.sincronizar();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('$ok registro(s) sincronizado(s)')),
      );
      _cargar();
    }
  }

  Future<void> _eliminar(Registro r) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Eliminar'),
        content: Text('¿Eliminar el registro ${r.folio}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Eliminar')),
        ],
      ),
    );
    if (confirm == true) {
      await _db.eliminar(r.id!);
      _cargar();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Beta - Siniestros'),
        actions: [
          IconButton(
            icon: const Icon(Icons.sync),
            tooltip: 'Sincronizar',
            onPressed: _sincronizar,
          ),
        ],
      ),
      body: _cargando
          ? const Center(child: CircularProgressIndicator())
          : _registros.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.location_off, size: 64, color: Colors.grey[400]),
                      const SizedBox(height: 16),
                      Text('Sin registros', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 8),
                      Text('Captura tu primera ubicación', style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _cargar,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(8),
                    itemCount: _registros.length,
                    itemBuilder: (_, i) {
                      final r = _registros[i];
                      final fecha = DateFormat('dd/MM/yy HH:mm').format(r.fecha);
                      return Dismissible(
                        key: ValueKey(r.id),
                        direction: DismissDirection.endToStart,
                        background: Container(
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 20),
                          color: Colors.red,
                          child: const Icon(Icons.delete, color: Colors.white),
                        ),
                        onDismissed: (_) => _eliminar(r),
                        child: Card(
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: r.sincronizado == 1
                                  ? Colors.green.shade100
                                  : Colors.orange.shade100,
                              child: Text(
                                r.sincronizado == 1 ? '☁' : '📱',
                                style: const TextStyle(fontSize: 20),
                              ),
                            ),
                            title: Text('${r.calle} #${r.numero}'),
                            subtitle: Text('$fecha\n${r.lat.toStringAsFixed(4)}, ${r.lng.toStringAsFixed(4)}'),
                            isThreeLine: true,
                            trailing: Text(r.folio.substring(0, 14), style: const TextStyle(fontSize: 10, color: Colors.grey)),
                          ),
                        ),
                      );
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final result = await Navigator.push<bool>(
            context,
            MaterialPageRoute(builder: (_) => const NuevoRegistroScreen()),
          );
          if (result == true) _cargar();
        },
        icon: const Icon(Icons.add_location_alt),
        label: const Text('Nuevo'),
      ),
    );
  }
}
