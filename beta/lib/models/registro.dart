class Registro {
  final int? id;
  final String folio;
  final double lat;
  final double lng;
  final String calle;
  final String numero;
  final DateTime fecha;
  final int sincronizado;

  Registro({
    this.id,
    required this.folio,
    required this.lat,
    required this.lng,
    required this.calle,
    required this.numero,
    DateTime? fecha,
    this.sincronizado = 0,
  }) : fecha = fecha ?? DateTime.now();

  Map<String, dynamic> toMap() => {
    'folio': folio,
    'lat': lat,
    'lng': lng,
    'calle': calle,
    'numero': numero,
    'fecha': fecha.toIso8601String(),
    'sincronizado': sincronizado,
  };

  factory Registro.fromMap(Map<String, dynamic> map) => Registro(
    id: map['id'] as int?,
    folio: map['folio'] as String,
    lat: (map['lat'] as num).toDouble(),
    lng: (map['lng'] as num).toDouble(),
    calle: map['calle'] as String,
    numero: map['numero'] as String,
    fecha: DateTime.parse(map['fecha'] as String),
    sincronizado: map['sincronizado'] as int? ?? 0,
  );
}
