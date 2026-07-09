import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/database_service.dart';
import '../models/reporte.dart';
import '../models/damnificado.dart';
import '../models/caracteristica_tipo.dart';
import '../models/valor_caracteristica.dart';
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
  List<ValorCaracteristica> _valores = [];
  List<CaracteristicaTipo> _caracteristicas = [];
  Map<String, CaracteristicaTipo> _caractsIndex = {};
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    setState(() => _loading = true);
    final r = await _db.getReporte(widget.reporteId);
    final damns = await _db.getDamnificados(widget.reporteId);
    final valores = await _db.getValoresCaracteristica(widget.reporteId);
    final caracts = await _db.getTodasCaracteristicas();
    setState(() {
      _reporte = r;
      _damnificados = damns;
      _valores = valores;
      _caracteristicas = caracts;
      _caractsIndex = {for (final c in caracts) c.id: c};
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

    final caractsTab2 = _caracteristicas.where((c) => c.orden >= 8 && c.orden <= 10).toList();
    final caractsTab3 = _caracteristicas.where((c) => c.orden == 11).toList();
    final caractsTab4 = _caracteristicas.where((c) => c.orden == 12).toList();
    final caractsTab5 = _caracteristicas.where((c) => c.orden == 13).toList();
    final caractsTab6 = _caracteristicas.where((c) => c.orden == 14).toList();

    final valorIndex = <String, ValorCaracteristica>{
      for (final v in _valores) v.caracteristicaId: v
    };

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
                  if (caractsTab2.isNotEmpty) ...[
                    const Divider(height: 24),
                    const Text('Características',
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    const SizedBox(height: 8),
                    ...caractsTab2.map((c) => _buildValorRow(c, valorIndex[c.id])),
                  ],
                ],
              ),
            ),
          ),
          if (caractsTab3.isNotEmpty) ...[
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(caractsTab3.first.nombre,
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    const SizedBox(height: 8),
                    ...caractsTab3.map((c) => _buildValorRow(c, valorIndex[c.id])),
                  ],
                ),
              ),
            ),
          ],
          if (caractsTab4.isNotEmpty) ...[
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(caractsTab4.first.nombre,
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    const SizedBox(height: 8),
                    ...caractsTab4.map((c) => _buildValorRow(c, valorIndex[c.id])),
                  ],
                ),
              ),
            ),
          ],
          if (caractsTab5.isNotEmpty) ...[
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(caractsTab5.first.nombre,
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    const SizedBox(height: 8),
                    ...caractsTab5.map((c) => _buildValorRow(c, valorIndex[c.id])),
                  ],
                ),
              ),
            ),
          ],
          if (caractsTab6.isNotEmpty) ...[
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(caractsTab6.first.nombre,
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                    const SizedBox(height: 8),
                    ...caractsTab6.map((c) => _buildValorRow(c, valorIndex[c.id])),
                  ],
                ),
              ),
            ),
          ],
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

  Widget _buildValorRow(CaracteristicaTipo c, ValorCaracteristica? v) {
    if (v == null) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 2),
        child: Row(
          children: [
            Icon(_iconForTipo(c.tipoDato), size: 16, color: Colors.grey),
            const SizedBox(width: 8),
            Text('${c.nombre}: ', style: const TextStyle(color: Colors.grey)),
            const Text('No especificado', style: TextStyle(color: Colors.grey)),
          ],
        ),
      );
    }

    String displayValue;
    switch (c.tipoDato) {
      case 'texto':
        displayValue = v.valorTexto ?? '';
        break;
      case 'numero':
        displayValue = v.valorNumero?.toString() ?? '';
        break;
      case 'booleano':
        displayValue = v.valorBooleano == true ? 'Sí' : 'No';
        break;
      case 'seleccion':
        displayValue = v.valorSeleccion ?? '';
        if (displayValue == 'Otro' && v.valorTexto != null) {
          displayValue = 'Otro: ${v.valorTexto}';
        }
        break;
      case 'multiseleccion':
        displayValue = v.valorSeleccion ?? '';
        break;
      default:
        displayValue = '';
    }

    if (displayValue.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(_iconForTipo(c.tipoDato), size: 16, color: Colors.grey),
          const SizedBox(width: 8),
          Expanded(
            child: RichText(
              text: TextSpan(
                style: DefaultTextStyle.of(context).style,
                children: [
                  TextSpan(
                    text: '${c.nombre}: ',
                    style: const TextStyle(fontWeight: FontWeight.w500),
                  ),
                  TextSpan(text: displayValue),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  IconData _iconForTipo(String tipoDato) {
    switch (tipoDato) {
      case 'texto':
        return Icons.text_fields;
      case 'numero':
        return Icons.numbers;
      case 'booleano':
        return Icons.toggle_on;
      case 'seleccion':
        return Icons.radio_button_checked;
      case 'multiseleccion':
        return Icons.check_box;
      default:
        return Icons.circle;
    }
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
