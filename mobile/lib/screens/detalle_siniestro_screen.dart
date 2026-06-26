import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/database_service.dart';
import '../models/reporte.dart';
import '../models/damnificado.dart';
import 'nuevo_damnificado_screen.dart';

class DetalleSiniestroScreen extends StatefulWidget {
  final String reporteId;

  const DetalleSiniestroScreen({super.key, required this.reporteId});

  @override
  State<DetalleSiniestroScreen> createState() => _DetalleSiniestroScreenState();
}

class _DetalleSiniestroScreenState extends State<DetalleSiniestroScreen> {
  final DatabaseService _db = DatabaseService();
  Reporte? _reporte;
  List<Damnificado> _damnificados = [];
  bool _loading = true;

  static const Map<String, String> _usosLabel = {
    'vivienda_unifamiliar': 'Vivienda Unifamiliar',
    'vivienda_multifamiliar': 'Vivienda Multifamiliar',
    'escuela': 'Escuela',
    'hospital': 'Hospital',
    'oficina': 'Oficina',
    'comercio': 'Comercio',
    'otro': 'Otro',
  };

  static const Map<String, String> _danosLabel = {
    'grietas_leves': 'Grietas leves',
    'grietas_estructurales': 'Grietas estructurales',
    'desprendimiento_acabados': 'Desprendimiento de acabados',
    'dano_columnas': 'Daño en columnas',
    'dano_trabes': 'Daño en trabes',
    'inclinacion': 'Inclinación',
    'colapso_parcial': 'Colapso parcial',
    'colapso_total': 'Colapso total',
  };

  static const Map<String, String> _condLabel = {
    'segura': 'Edificación segura',
    'riesgo_alto': 'Riesgo alto',
    'riesgo_medio': 'Riesgo medio',
    'riesgo_bajo': 'Riesgo bajo',
  };

  static const Map<String, Color> _condColor = {
    'segura': Colors.green,
    'riesgo_alto': Colors.red,
    'riesgo_medio': Colors.orange,
    'riesgo_bajo': Colors.yellow,
  };

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    setState(() => _loading = true);
    final r = await _db.getReporte(widget.reporteId);
    final damns = await _db.getDamnificados(widget.reporteId);
    setState(() {
      _reporte = r;
      _damnificados = damns;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Cargando...')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final r = _reporte;
    if (r == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Error')),
        body: const Center(child: Text('Reporte no encontrado')),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text(r.folio)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(r.folio,
                      style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  _infoRow(Icons.person, 'Capturista: ${r.nombreCapturista}'),
                  _infoRow(Icons.work, 'Área: ${r.area}'),
                  _infoRow(Icons.calendar_today,
                      'Fecha: ${DateFormat('dd/MM/yyyy HH:mm').format(r.fecha)}'),
                  if (!r.sincronizado)
                    Chip(
                      label: const Text('Sin sincronizar'),
                      avatar: const Icon(Icons.cloud_off, size: 16),
                      backgroundColor: Colors.orange.shade100,
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Inmueble afectado',
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  const SizedBox(height: 8),
                  _infoRow(Icons.location_on, r.calleNumero),
                  _infoRow(Icons.map, 'Col. ${r.colonia}, ${r.alcaldia}'),
                  if (r.codigoPostal.isNotEmpty)
                    _infoRow(Icons.markunread_mailbox, 'CP ${r.codigoPostal}'),
                  if (r.lat != null && r.lng != null)
                    _infoRow(Icons.gps_fixed,
                        '${r.lat!.toStringAsFixed(5)}, ${r.lng!.toStringAsFixed(5)}'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Uso del Inmueble',
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  const SizedBox(height: 8),
                  _infoRow(Icons.home,
                      _usosLabel[r.usoInmueble] ?? r.usoInmueble),
                  if (r.usoInmueble == 'otro' && r.otroUso != null && r.otroUso!.isNotEmpty)
                    _infoRow(Icons.edit, r.otroUso!),
                  _infoRow(Icons.stairs, '${r.numeroNiveles} nivel(es)'),
                  if (r.fechaConstruccion.isNotEmpty)
                    _infoRow(Icons.calendar_view_month, 'Construcción: ${r.fechaConstruccion}'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Daños observados',
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  const SizedBox(height: 8),
                  if (r.danosObservados.isEmpty)
                    const Text('Ninguno', style: TextStyle(color: Colors.grey))
                  else
                    ...r.danosObservados.split(',').map(
                          (d) => Padding(
                            padding: const EdgeInsets.symmetric(vertical: 1),
                            child: Row(
                              children: [
                                const Icon(Icons.warning_amber, size: 16, color: Colors.red),
                                const SizedBox(width: 6),
                                Text(_danosLabel[d.trim()] ?? d.trim()),
                              ],
                            ),
                          ),
                        ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Condición de seguridad',
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  const SizedBox(height: 8),
                  Chip(
                    label: Text(_condLabel[r.condicionSeguridad] ?? r.condicionSeguridad),
                    backgroundColor:
                        (_condColor[r.condicionSeguridad] ?? Colors.grey).withOpacity(0.2),
                  ),
                ],
              ),
            ),
          ),
          if (r.observaciones.isNotEmpty) ...[
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Observaciones',
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    const SizedBox(height: 8),
                    Text(r.observaciones),
                  ],
                ),
              ),
            ),
          ],
          if (r.fotos.isNotEmpty) ...[
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Fotografías',
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    const SizedBox(height: 8),
                    ...r.fotos.split(',').map(
                          (f) => Padding(
                            padding: const EdgeInsets.symmetric(vertical: 1),
                            child: Row(
                              children: [
                                const Icon(Icons.image, size: 16),
                                const SizedBox(width: 6),
                                Expanded(child: Text(f.trim(), overflow: TextOverflow.ellipsis)),
                              ],
                            ),
                          ),
                        ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Damnificados (${_damnificados.length})',
                  style: Theme.of(context).textTheme.titleMedium),
              FilledButton.tonalIcon(
                onPressed: () async {
                  await Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => NuevoDamnificadoScreen(reporteId: r.id),
                    ),
                  );
                  _cargar();
                },
                icon: const Icon(Icons.person_add, size: 18),
                label: const Text('Agregar'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (_damnificados.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: Text('Sin damnificados registrados')),
              ),
            )
          else
            ..._damnificados.map((d) => _buildDamnificadoCard(d)),
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.grey),
          const SizedBox(width: 8),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }

  Widget _buildDamnificadoCard(Damnificado d) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Colors.blue.withOpacity(0.2),
          child: const Icon(Icons.person, color: Colors.blue),
        ),
        title: Text(d.nombre.isNotEmpty ? d.nombre : 'Sin nombre',
            style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(
          '${d.edad > 0 ? '${d.edad} años' : ''} ${d.sexo.isNotEmpty ? '· ${d.sexo == "M" ? "Masculino" : "Femenino"}' : ''}',
        ),
        trailing: Chip(
          label: Text(_labelEstado(d.estado), style: const TextStyle(fontSize: 11)),
          backgroundColor: _colorEstado(d.estado).withOpacity(0.2),
          visualDensity: VisualDensity.compact,
        ),
      ),
    );
  }

  String _labelEstado(String estado) {
    switch (estado) {
      case 'fallecido':
        return 'Fallecido';
      case 'lesionado_grave':
        return 'Lesionado Grave';
      case 'lesionado_leve':
        return 'Lesionado Leve';
      default:
        return 'Ileso';
    }
  }

  Color _colorEstado(String estado) {
    switch (estado) {
      case 'fallecido':
        return Colors.black;
      case 'lesionado_grave':
        return Colors.red;
      case 'lesionado_leve':
        return Colors.orange;
      default:
        return Colors.green;
    }
  }
}
