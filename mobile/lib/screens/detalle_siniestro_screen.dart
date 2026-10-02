import 'dart:io';

import 'package:flutter/material.dart';
import '../services/database_service.dart';
import '../services/sync_service.dart';
import '../models/reporte.dart';
import '../models/damnificado.dart';
import '../models/caracteristica_tipo.dart';
import '../models/valor_caracteristica.dart';

class DetalleSiniestroScreen extends StatefulWidget {
  final String reporteId;

  const DetalleSiniestroScreen({super.key, required this.reporteId});

  @override
  State<DetalleSiniestroScreen> createState() => _DetalleSiniestroScreenState();
}

class _DetalleSiniestroScreenState extends State<DetalleSiniestroScreen> {
  static const Color _maroon = Color(0xFF7A0C38);
  static const Color _maroonBg = Color(0xFFFDF2F8);
  static const Color _maroonBorder = Color(0xFFF3D4E0);
  static const Color _borde = Color(0xFFCBD5E1);
  static const Color _texto = Color(0xFF1E293B);

  static const Map<int, String> _titulosSecciones = {
    2: 'Inmueble (padrón)',
    3: 'Estado de la edificación',
    4: 'Clasificación global',
    5: 'Recomendaciones',
    6: 'Fotografías',
  };

  static const Map<String, String> _alcaldiasPorCP = {
    '01': 'Álvaro Obregón',
    '02': 'Azcapotzalco',
    '03': 'Benito Juárez',
    '04': 'Coyoacán',
    '05': 'Cuajimalpa de Morelos',
    '06': 'Cuauhtémoc',
    '07': 'Gustavo A. Madero',
    '08': 'Iztacalco',
    '09': 'Iztapalapa',
    '10': 'La Magdalena Contreras',
    '11': 'Miguel Hidalgo',
    '12': 'Milpa Alta',
    '13': 'Tláhuac',
    '14': 'Tlalpan',
    '15': 'Venustiano Carranza',
    '16': 'Xochimilco',
  };

  final DatabaseService _db = DatabaseService();
  Reporte? _reporte;
  List<Damnificado> _damnificados = [];
  List<ValorCaracteristica> _valores = [];
  List<CaracteristicaTipo> _caracteristicas = [];
  String _dispositivoId = '';
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
    String did = '';
    try {
      did = await SyncService().dispositivoId;
    } catch (_) {}
    setState(() {
      _dispositivoId = did;
      _reporte = r;
      _damnificados = damns;
      _valores = valores;
      _caracteristicas = caracts;
      _loading = false;
    });
  }

  String _norm(String s) {
    var t = s.toLowerCase();
    const mapa = {
      'á': 'a',
      'é': 'e',
      'í': 'i',
      'ó': 'o',
      'ú': 'u',
      'ü': 'u',
      'ñ': 'n',
    };
    mapa.forEach((k, v) => t = t.replaceAll(k, v));
    return t;
  }

  int? _numeroDe(String clave) {
    String? id;
    for (final c in _caracteristicas) {
      if (_norm(c.nombre).contains(clave)) {
        id = c.id;
        break;
      }
    }
    if (id == null) return null;
    for (final v in _valores) {
      if (v.caracteristicaId != id) continue;
      final n = int.tryParse(v.valorSeleccion ?? '') ?? v.valorNumero?.round();
      if (n != null) return n;
    }
    return null;
  }

  int _numSeccion(String nombre) {
    final m = RegExp(r'^(\d+)\.').firstMatch(nombre.trim());
    return m != null ? int.tryParse(m.group(1)!) ?? 0 : 0;
  }

  String _numCaracteristica(String nombre) {
    final m = RegExp(r'^(\d+(?:\.\d+)*)').firstMatch(nombre.trim());
    return m?.group(1) ?? '';
  }

  String _nombreLimpio(String nombre) =>
      nombre.trim().replaceFirst(RegExp(r'^\d+(?:\.\d+)*\s*'), '').trim();

  String _alcaldiaResuelta(Reporte r) {
    final mun = r.alcaldia.trim();
    final munNorm = _norm(mun);
    if (mun.isNotEmpty && munNorm != 'ciudad de mexico' && munNorm != 'cdmx') {
      return mun;
    }
    final cp = r.codigoPostal.trim();
    for (final e in _alcaldiasPorCP.entries) {
      if (cp.startsWith(e.key)) return e.value;
    }
    return mun.isNotEmpty ? mun : 'Ciudad de México';
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        backgroundColor: const Color(0xFFF1F5F9),
        appBar: AppBar(
          title: const Text('Cargando...'),
          backgroundColor: _maroon,
          foregroundColor: Colors.white,
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final r = _reporte;
    if (r == null) {
      return Scaffold(
        backgroundColor: const Color(0xFFF1F5F9),
        appBar: AppBar(
          title: const Text('Error'),
          backgroundColor: _maroon,
          foregroundColor: Colors.white,
        ),
        body: const Center(child: Text('Reporte no encontrado')),
      );
    }

    final valorIndex = <String, ValorCaracteristica>{
      for (final v in _valores) v.caracteristicaId: v
    };

    int? niveles = _numeroDe('numero de niveles sobre el terreno');
    int? sotanos = _numeroDe('numero de sotanos');
    if (niveles == null && sotanos == null) {
      niveles = r.sobreNivelBanqueta;
      sotanos = r.bajoNivelBanqueta;
    }
    final nivelesTotales = (niveles ?? 0) + (sotanos ?? 0);

    final filasPorSeccion = <int, List<_FilaTabla>>{};
    final caracts = [..._caracteristicas]
      ..sort((a, b) => a.orden.compareTo(b.orden));
    for (final c in caracts) {
      final sec = _numSeccion(c.nombre);
      if (sec <= 0) continue;
      filasPorSeccion.putIfAbsent(sec, () => []).add(_FilaTabla(
            num: _numCaracteristica(c.nombre),
            nombre: _nombreLimpio(c.nombre),
            valor: _valorDe(c, valorIndex[c.id], niveles, sotanos),
          ));
    }

    final fotos = r.fotos
        .split(',')
        .map((p) => p.trim())
        .where((p) => p.isNotEmpty)
        .toList();

    final secciones = filasPorSeccion.keys.toList()..sort();

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: Text(r.folio,
            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 17)),
        backgroundColor: _maroon,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(14),
        children: [
          _encabezado(r, niveles, sotanos, nivelesTotales),
          for (final sec in secciones) ...[
            const SizedBox(height: 14),
            _seccion(
              sec,
              filasPorSeccion[sec]!,
              fotos: sec == 6 ? fotos : const [],
            ),
          ],
          if (fotos.isNotEmpty && !secciones.contains(6)) ...[
            const SizedBox(height: 14),
            _seccion(6, const [], fotos: fotos),
          ] else if (secciones.isEmpty) ...[
            const SizedBox(height: 14),
            _sinContenido(),
          ],
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _encabezado(
      Reporte r, int? niveles, int? sotanos, int nivelesTotales) {
    final estado = r.estadoAfectacion;
    final colorEstado = estado == 'critico'
        ? Colors.red
        : estado == 'moderado'
            ? Colors.orange
            : estado == 'colapso'
                ? Colors.black
                : Colors.green;
    final textoEstado = estado == 'critico'
        ? 'Riesgo alto'
        : estado == 'moderado'
            ? 'Riesgo medio'
            : estado == 'colapso'
                ? 'Colapso'
                : 'Riesgo bajo';

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _borde),
        boxShadow: const [
          BoxShadow(
              color: Color(0x14000000), blurRadius: 8, offset: Offset(0, 3)),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration:
                    const BoxDecoration(color: _maroon, shape: BoxShape.circle),
                child: const Icon(Icons.assignment_turned_in_outlined,
                    color: Colors.white, size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'REPORTE DE INSPECCIÓN DE INMUEBLE',
                      style: TextStyle(
                          fontSize: 14.5,
                          fontWeight: FontWeight.w800,
                          color: _texto),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'SAS • Sistema de Afectaciones por Sismo',
                      style:
                          TextStyle(fontSize: 11, color: Colors.grey.shade600),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(height: 3, width: double.infinity, color: _maroon),
          const SizedBox(height: 12),
          _fila2(
            _dato('Fecha', r.fechaDisplay),
            _dato('Folio de inspección', r.folio),
          ),
          const SizedBox(height: 8),
          _fila2(
            _dato(
                'Coordenadas',
                (r.lat != null && r.lng != null)
                    ? '${r.lat!.toStringAsFixed(5)}, ${r.lng!.toStringAsFixed(5)}'
                    : 'No disponible'),
            _dato('Nivel de afectación', textoEstado, valorColor: colorEstado),
          ),
          const SizedBox(height: 8),
          _datoAncho('Dirección',
              '${r.calleNumero}, ${r.colonia}, ${_alcaldiaResuelta(r)}${r.codigoPostal.isNotEmpty ? ', C.P. ${r.codigoPostal}' : ''}, CDMX'),
          const SizedBox(height: 8),
          _datoAncho(
              'Descripción',
              r.observaciones.isNotEmpty
                  ? r.observaciones
                  : 'Sin observaciones adicionales registradas.'),
          const SizedBox(height: 8),
          _datoAncho('Niveles',
              'Sobre el terreno (2.10): ${niveles ?? 0}  |  Sótanos (2.11): ${sotanos ?? 0}  |  Totales: $nivelesTotales'),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                decoration: BoxDecoration(
                  color: colorEstado.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: colorEstado.withOpacity(0.5)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.warning_amber_rounded,
                        size: 15, color: colorEstado),
                    const SizedBox(width: 5),
                    Text(textoEstado,
                        style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: colorEstado.shade800)),
                  ],
                ),
              ),
              if (!r.sincronizado)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade100,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.orange.shade400),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.cloud_off, size: 15, color: Colors.orange),
                      SizedBox(width: 5),
                      Text('Sin sincronizar',
                          style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: Colors.deepOrange)),
                    ],
                  ),
                ),
              if (_damnificados.isNotEmpty)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                  decoration: BoxDecoration(
                    color: _maroonBg,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: _maroonBorder),
                  ),
                  child: Text('${_damnificados.length} damnificado(s)',
                      style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: _maroon)),
                ),
              if (_dispositivoId.isNotEmpty)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: _borde),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.smartphone,
                          size: 15, color: Color(0xFF64748B)),
                      const SizedBox(width: 5),
                      Text(
                          'Dispositivo: ${_dispositivoId.substring(0, _dispositivoId.length > 8 ? 8 : _dispositivoId.length)}',
                          style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF64748B))),
                    ],
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _seccion(int num, List<_FilaTabla> filas,
      {List<String> fotos = const []}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(height: 2, width: double.infinity, color: _maroon),
        const SizedBox(height: 8),
        Text(
          '$num. ${_titulosSecciones[num] ?? 'Sección $num'}',
          style: const TextStyle(
              color: _maroon, fontWeight: FontWeight.w800, fontSize: 15),
        ),
        if (filas.isNotEmpty) ...[
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: _borde),
              boxShadow: const [
                BoxShadow(
                    color: Color(0x10000000),
                    blurRadius: 6,
                    offset: Offset(0, 2)),
              ],
            ),
            clipBehavior: Clip.antiAlias,
            child: Table(
              defaultVerticalAlignment: TableCellVerticalAlignment.middle,
              columnWidths: const {
                0: FixedColumnWidth(42),
                1: FlexColumnWidth(1.4),
                2: FlexColumnWidth(1),
              },
              children: [
                const TableRow(children: [
                  _Celda('No.', header: true, centrado: true),
                  _Celda('Características', header: true),
                  _Celda('Valor', header: true),
                ]),
                for (final f in filas)
                  TableRow(children: [
                    _Celda(f.num,
                        centrado: true, negrita: true, colorTexto: _maroon),
                    _Celda(f.nombre),
                    _Celda(f.valor, colorTexto: _colorValor(f.valor)),
                  ]),
              ],
            ),
          ),
        ],
        if (fotos.isNotEmpty) ...[
          const SizedBox(height: 10),
          _galeria(fotos),
        ],
      ],
    );
  }

  Widget _sinContenido() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _borde),
      ),
      child: const Column(
        children: [
          Icon(Icons.inbox_outlined, size: 36, color: Color(0xFF94A3B8)),
          SizedBox(height: 8),
          Text(
            'Este reporte aún no tiene características capturadas.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
          ),
        ],
      ),
    );
  }

  Widget _galeria(List<String> fotos) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.zero,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 1.05,
      ),
      itemCount: fotos.length,
      itemBuilder: (context, i) => _tarjetaFoto(fotos[i], i + 1),
    );
  }

  Widget _tarjetaFoto(String ruta, int indice) {
    return GestureDetector(
      onTap: () => _verFoto(ruta, indice),
      child: Container(
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: _borde),
          boxShadow: const [
            BoxShadow(
                color: Color(0x14000000), blurRadius: 6, offset: Offset(0, 2)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(child: _imagen(ruta, BoxFit.cover, llenar: true)),
            Container(
              padding: const EdgeInsets.symmetric(vertical: 6),
              color: _maroonBg,
              alignment: Alignment.center,
              child: Text('Foto $indice',
                  style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: _maroon)),
            ),
          ],
        ),
      ),
    );
  }

  void _verFoto(String ruta, int indice) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.black87,
        insetPadding: const EdgeInsets.all(12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                const SizedBox(width: 16),
                Text('Foto $indice',
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 14)),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.white),
                  onPressed: () => Navigator.of(ctx).pop(),
                ),
              ],
            ),
            Flexible(
              child: InteractiveViewer(
                child: _imagen(ruta, BoxFit.contain, llenar: false),
              ),
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }

  Widget _imagen(String ruta, BoxFit fit, {required bool llenar}) {
    final w = llenar ? double.infinity : null;
    final h = llenar ? double.infinity : null;

    if (ruta.startsWith('http')) {
      return Image.network(
        ruta,
        fit: fit,
        width: w,
        height: h,
        loadingBuilder: (context, child, progress) {
          if (progress == null) return child;
          return const Center(child: CircularProgressIndicator(strokeWidth: 2));
        },
        errorBuilder: (_, __, ___) => _placeholder(),
      );
    }

    return Image.file(
      File(ruta),
      fit: fit,
      width: w,
      height: h,
      errorBuilder: (_, __, ___) => _placeholder(),
    );
  }

  Widget _placeholder() {
    return Container(
      color: const Color(0xFFF1F5F9),
      alignment: Alignment.center,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.image_not_supported_outlined,
              color: Colors.grey.shade400, size: 28),
          const SizedBox(height: 4),
          Text('Imagen no disponible',
              style: TextStyle(fontSize: 10, color: Colors.grey.shade500)),
        ],
      ),
    );
  }

  String _valorDe(CaracteristicaTipo c, ValorCaracteristica? v, int? niveles,
      int? sotanos) {
    final texto = _valorTexto(c, v);
    if (texto.isNotEmpty) return texto;

    final n = _norm(c.nombre);
    if (n.contains('numero de niveles sobre terreno') ||
        n.contains('numero de niveles sobre el terreno')) {
      return '${niveles ?? 0}';
    }
    if (n.contains('numero de sotanos')) return '${sotanos ?? 0}';
    if (n.contains('alcaldia')) return _alcaldiaResuelta(_reporte!);
    return '—';
  }

  String _valorTexto(CaracteristicaTipo c, ValorCaracteristica? v) {
    if (v == null) return '';

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

    final cond = (v.valorTextoCondicional ?? '').trim();
    if (cond.isNotEmpty) {
      displayValue = displayValue.isEmpty ? cond : '$displayValue — $cond';
    }
    return displayValue;
  }

  Color? _colorValor(String valor) {
    final s = _norm(valor);
    if (s.contains('colapso')) return const Color(0xFF111827);
    if (s.contains('alto') || s.contains('critico'))
      return const Color(0xFF991B1B);
    if (s.contains('medio') ||
        s.contains('moderado') ||
        s.contains('insegura')) {
      return const Color(0xFF854D0E);
    }
    if (s.contains('bajo') || s == 'no' || s == 'si')
      return const Color(0xFF166534);
    return null;
  }

  Widget _fila2(Widget a, Widget b) {
    return Row(
      children: [
        Expanded(child: a),
        const SizedBox(width: 8),
        Expanded(child: b),
      ],
    );
  }

  Widget _dato(String label, String value, {Color? valorColor}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: _maroonBg,
        border: Border.all(color: _maroonBorder),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(),
              style: const TextStyle(
                  fontSize: 9.5,
                  fontWeight: FontWeight.w800,
                  color: _maroon,
                  letterSpacing: 0.3)),
          const SizedBox(height: 3),
          Text(value,
              style: TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w700,
                  color: valorColor ?? _texto)),
        ],
      ),
    );
  }

  Widget _datoAncho(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(
            color: _maroonBg,
            border: Border.all(color: _maroonBorder),
            borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(6), topRight: Radius.circular(6)),
          ),
          child: Text(label.toUpperCase(),
              style: const TextStyle(
                  fontSize: 9.5,
                  fontWeight: FontWeight.w800,
                  color: _maroon,
                  letterSpacing: 0.3)),
        ),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(color: _maroonBorder),
            borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(6),
                bottomRight: Radius.circular(6)),
          ),
          child: Text(value,
              style: const TextStyle(
                  fontSize: 12.5, fontWeight: FontWeight.w600, color: _texto)),
        ),
      ],
    );
  }
}

class _FilaTabla {
  final String num;
  final String nombre;
  final String valor;

  const _FilaTabla(
      {required this.num, required this.nombre, required this.valor});
}

class _Celda extends StatelessWidget {
  final String texto;
  final bool header;
  final bool centrado;
  final bool negrita;
  final Color? colorTexto;

  const _Celda(
    this.texto, {
    this.header = false,
    this.centrado = false,
    this.negrita = false,
    this.colorTexto,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      alignment: centrado ? Alignment.center : Alignment.centerLeft,
      decoration: BoxDecoration(
        color: header ? const Color(0xFF7A0C38) : Colors.white,
        border: Border.all(
            color: header ? const Color(0xFF7A0C38) : const Color(0xFFCBD5E1),
            width: 0.5),
      ),
      child: Text(
        texto,
        textAlign: centrado ? TextAlign.center : TextAlign.left,
        style: TextStyle(
          fontSize: 11.5,
          fontWeight: header || negrita ? FontWeight.w700 : FontWeight.w500,
          color:
              header ? Colors.white : (colorTexto ?? const Color(0xFF334155)),
        ),
      ),
    );
  }
}
