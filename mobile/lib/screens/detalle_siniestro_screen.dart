import 'package:flutter/material.dart';
import '../services/database_service.dart';
import '../models/siniestro.dart';
import '../models/inmueble.dart';
import '../models/damnificado.dart';
import '../models/valor_caracteristica.dart';
import 'nuevo_inmueble_screen.dart';
import 'nuevo_damnificado_screen.dart';

class DetalleSiniestroScreen extends StatefulWidget {
  final String siniestroId;

  const DetalleSiniestroScreen({super.key, required this.siniestroId});

  @override
  State<DetalleSiniestroScreen> createState() => _DetalleSiniestroScreenState();
}

class _DetalleSiniestroScreenState extends State<DetalleSiniestroScreen> {
  final DatabaseService _db = DatabaseService();
  Siniestro? _siniestro;
  List<Inmueble> _inmuebles = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _cargar();
  }

  Future<void> _cargar() async {
    setState(() => _loading = true);
    final s = await _db.getSiniestro(widget.siniestroId);
    final inmuebles = await _db.getInmuebles(widget.siniestroId);
    setState(() {
      _siniestro = s;
      _inmuebles = inmuebles;
      _loading = false;
    });
  }

  Color _colorAfectacion(String estado) {
    switch (estado) {
      case 'critico':
        return Colors.red;
      case 'moderado':
        return Colors.orange;
      default:
        return Colors.green;
    }
  }

  String _labelAfectacion(String estado) {
    switch (estado) {
      case 'critico':
        return 'Crítico';
      case 'moderado':
        return 'Moderado';
      default:
        return 'Sin daños';
    }
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

  Future<void> _agregarInmueble({String? padreId, String? siniestroId}) async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => NuevoInmuebleScreen(
          siniestroId: siniestroId ?? widget.siniestroId,
          padreId: padreId,
        ),
      ),
    );
    _cargar();
  }

  Future<void> _agregarDamnificado(String inmuebleId) async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => NuevoDamnificadoScreen(inmuebleId: inmuebleId),
      ),
    );
    _cargar();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Cargando...')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final s = _siniestro;
    if (s == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Error')),
        body: const Center(child: Text('Siniestro no encontrado')),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text(s.folio)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(s.folio, style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  _infoRow(Icons.location_on, s.direccion),
                  _infoRow(Icons.map, '${s.municipio}, ${s.estado}'),
                  _infoRow(Icons.description, s.descripcion),
                  if (!s.sincronizado)
                    Chip(
                      label: const Text('Sin sincronizar'),
                      avatar: const Icon(Icons.cloud_off, size: 16),
                      backgroundColor: Colors.orange.shade100,
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Inmuebles (${_inmuebles.length})',
                  style: Theme.of(context).textTheme.titleMedium),
              FilledButton.tonalIcon(
                onPressed: () => _agregarInmueble(padreId: null, siniestroId: s.id),
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Agregar'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (_inmuebles.isEmpty)
            const Card(
              child: Padding(
                padding: EdgeInsets.all(24),
                child: Center(child: Text('Sin inmuebles registrados')),
              ),
            )
          else
            ..._inmuebles.map((inm) => _buildInmuebleCard(inm)),
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

  Widget _buildInmuebleCard(Inmueble inm) {
    return FutureBuilder<List<dynamic>>(
      future: Future.wait([
        _db.getDamnificados(inm.id),
        _db.getValoresCaracteristica(inm.id),
      ]),
      builder: (ctx, snap) {
        final damnificados = snap.data?[0] as List<Damnificado>? ?? [];
        final valores = snap.data?[1] as List<ValorCaracteristica>? ?? [];
        final esEdificio = inm.tipo == 'edificio';
        final esPadre = inm.esPadre;

        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ExpansionTile(
            leading: CircleAvatar(
              backgroundColor: _colorAfectacion(inm.estadoAfectacion).withOpacity(0.2),
              child: Icon(
                esEdificio ? Icons.apartment : Icons.home,
                color: _colorAfectacion(inm.estadoAfectacion),
              ),
            ),
            title: Text(
              inm.tipo.isNotEmpty
                  ? '${inm.tipo} - ${inm.identificador}'
                  : inm.identificador.isNotEmpty
                      ? inm.identificador
                      : 'Sin identificar',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            subtitle: Text(
              '${inm.numeroNiveles} nivel(es)${inm.tipoUnidad.isNotEmpty ? ' · ${inm.tipoUnidad == "vivienda" ? "Vivienda" : "Oficina"}' : ''} · ${_labelAfectacion(inm.estadoAfectacion)}',
            ),
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (valores.isNotEmpty) ...[
                      const Divider(),
                      Text('Características',
                          style: const TextStyle(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 4),
                      ...valores.map((v) => _buildValorRow(v)),
                    ],
                    if (damnificados.isNotEmpty) ...[
                      const Divider(),
                      Text('Damnificados (${damnificados.length})',
                          style: const TextStyle(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 4),
                      ...damnificados.map(
                        (d) => ListTile(
                          dense: true,
                          title: Text(d.nombre.isNotEmpty ? d.nombre : 'Sin nombre'),
                          subtitle: Text(
                            '${d.edad > 0 ? '${d.edad} años' : ''} ${d.sexo.isNotEmpty ? '· ${d.sexo}' : ''}',
                          ),
                          trailing: Chip(
                            label: Text(_labelEstado(d.estado),
                                style: const TextStyle(fontSize: 11)),
                            backgroundColor:
                                _colorAfectacion(d.estado == 'fallecido' || d.estado == 'lesionado_grave'
                                        ? 'critico'
                                        : d.estado == 'ileso'
                                            ? 'sin_daños'
                                            : 'moderado')
                                    .withOpacity(0.2),
                            visualDensity: VisualDensity.compact,
                          ),
                        ),
                      ),
                    ],
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton.icon(
                          icon: const Icon(Icons.person_add, size: 18),
                          label: const Text('Damnificado'),
                          onPressed: () => _agregarDamnificado(inm.id),
                        ),
                        if (esEdificio && esPadre)
                          TextButton.icon(
                            icon: const Icon(Icons.add_business, size: 18),
                            label: const Text('Departamento'),
                            onPressed: () => _agregarInmueble(
                              padreId: inm.id,
                              siniestroId: widget.siniestroId,
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildValorRow(ValorCaracteristica v) {
    String label;
    if (v.valorTexto != null) {
      label = v.valorTexto!;
    } else if (v.valorNumero != null) {
      label = v.valorNumero.toString();
    } else if (v.valorBooleano != null) {
      label = v.valorBooleano! ? 'Sí' : 'No';
    } else if (v.valorSeleccion != null) {
      label = v.valorSeleccion!;
    } else {
      label = '-';
    }
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 1),
      child: Text('• $label', style: const TextStyle(fontSize: 13)),
    );
  }
}
