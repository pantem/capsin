class ReporteSeguimiento {
  final String id;
  final String inmueblePadronId;
  final String capturista;
  final DateTime fecha;
  final String clasificacionGlobal;
  final String observaciones;
  final String fotos;
  final bool sincronizado;

  ReporteSeguimiento({
    required this.id,
    required this.inmueblePadronId,
    this.capturista = '',
    DateTime? fecha,
    this.clasificacionGlobal = '',
    this.observaciones = '',
    this.fotos = '',
    this.sincronizado = false,
  }) : fecha = fecha ?? DateTime.now();

  String get fechaDisplay =>
      '${fecha.day.toString().padLeft(2, '0')}-${fecha.month.toString().padLeft(2, '0')}-${fecha.year}';

  String get fechaDb =>
      '${fecha.year}-${fecha.month.toString().padLeft(2, '0')}-${fecha.day.toString().padLeft(2, '0')}';

  Map<String, dynamic> toMap() => {
        'id': id,
        'inmueblePadronId': inmueblePadronId,
        'capturista': capturista,
        'fecha': fechaDb,
        'clasificacionGlobal': clasificacionGlobal,
        'observaciones': observaciones,
        'fotos': fotos,
        'sincronizado': sincronizado ? 1 : 0,
      };

  factory ReporteSeguimiento.fromMap(Map<String, dynamic> map) =>
      ReporteSeguimiento(
        id: map['id'] as String,
        inmueblePadronId: map['inmueblePadronId'] as String? ?? '',
        capturista: map['capturista'] as String? ?? '',
        fecha:
            DateTime.tryParse(map['fecha'] as String? ?? '') ?? DateTime.now(),
        clasificacionGlobal: map['clasificacionGlobal'] as String? ?? '',
        observaciones: map['observaciones'] as String? ?? '',
        fotos: map['fotos'] as String? ?? '',
        sincronizado: (map['sincronizado'] as int? ?? 0) == 1,
      );

  Map<String, dynamic> toJson() => {
        'inmueble_padron': inmueblePadronId,
        'capturista': capturista,
        'fecha': fechaDb,
        'clasificacion_global': clasificacionGlobal,
        'observaciones': observaciones,
        'fotos': fotos,
      };
}
