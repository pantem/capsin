import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/database_service.dart';
import '../models/reporte.dart';
import '../services/sync_service.dart';
import '../services/auth_service.dart';
import 'nuevo_reporte_screen.dart';
import 'detalle_siniestro_screen.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final DatabaseService _db = DatabaseService();
  final AuthService _auth = AuthService();
  List<Reporte> _reportes = [];
  bool _loading = true;
  String _userNombre = '';

  @override
  void initState() {
    super.initState();
    _cargar();
    _cargarUsuario();
  }

  Future<void> _cargarUsuario() async {
    final nombre = await _auth.getUserNombre();
    if (!mounted) return;
    setState(() => _userNombre = nombre);
  }

  Future<void> _logout() async {
    await _auth.logout();
    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  Future<void> _cargar() async {
    setState(() => _loading = true);
    final data = await _db.getReportes();
    setState(() {
      _reportes = data;
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
        title: Text(_userNombre.isNotEmpty ? _userNombre : 'Siniestros Sismo'),
        actions: [
          IconButton(
            icon: const Icon(Icons.sync),
            onPressed: _sincronizar,
            tooltip: 'Sincronizar',
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
            tooltip: 'Cerrar sesión',
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _reportes.isEmpty
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
                    itemCount: _reportes.length,
                    itemBuilder: (_, i) {
                      final r = _reportes[i];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          title: Text(r.folio,
                              style: const TextStyle(fontWeight: FontWeight.bold)),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '${r.calleNumero}\n${r.colonia}',
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: r.estadoAfectacion == 'critico'
                                          ? Colors.red.shade100
                                          : r.estadoAfectacion == 'moderado'
                                              ? Colors.orange.shade100
                                              : Colors.green.shade100,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      r.estadoAfectacion == 'critico'
                                          ? 'Crítico'
                                          : r.estadoAfectacion == 'moderado'
                                              ? 'Moderado'
                                              : 'Sin daños',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: r.estadoAfectacion == 'critico'
                                            ? Colors.red.shade800
                                            : r.estadoAfectacion == 'moderado'
                                                ? Colors.orange.shade800
                                                : Colors.green.shade800,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    DateFormat('dd-MM-yyyy').format(r.fecha),
                                    style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              if (!r.sincronizado)
                                const Icon(Icons.cloud_off, size: 18, color: Colors.grey),
                              IconButton(
                                icon: const Icon(Icons.delete_outline, color: Colors.red),
                                onPressed: () async {
                                  await _db.deleteReporte(r.id);
                                  _cargar();
                                },
                              ),
                            ],
                          ),
                          onTap: () async {
                            await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => DetalleSiniestroScreen(reporteId: r.id),
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
            MaterialPageRoute(builder: (_) => const NuevoReporteScreen()),
          );
          _cargar();
        },
        icon: const Icon(Icons.add),
        label: const Text('Nuevo Reporte'),
      ),
    );
  }
}
