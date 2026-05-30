class Siniestro {
  final String id;
  final String folio;
  final DateTime fecha;
  final double lat;
  final double lng;
  final String direccion;
  final String municipio;
  final String estado;
  final String descripcion;
  final bool sincronizado;

  Siniestro({
    required this.id,
    required this.folio,
    required this.fecha,
    required this.lat,
    required this.lng,
    this.direccion = '',
    this.municipio = '',
    this.estado = '',
    this.descripcion = '',
    this.sincronizado = false,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'folio': folio,
        'fecha': fecha.toIso8601String(),
        'lat': lat,
        'lng': lng,
        'direccion': direccion,
        'municipio': municipio,
        'estado': estado,
        'descripcion': descripcion,
        'sincronizado': sincronizado ? 1 : 0,
      };

  factory Siniestro.fromMap(Map<String, dynamic> map) => Siniestro(
        id: map['id'] as String,
        folio: map['folio'] as String,
        fecha: DateTime.parse(map['fecha'] as String),
        lat: (map['lat'] as num).toDouble(),
        lng: (map['lng'] as num).toDouble(),
        direccion: map['direccion'] as String? ?? '',
        municipio: map['municipio'] as String? ?? '',
        estado: map['estado'] as String? ?? '',
        descripcion: map['descripcion'] as String? ?? '',
        sincronizado: (map['sincronizado'] as int? ?? 0) == 1,
      );

  Map<String, dynamic> toJson() => {
        'folio': folio,
        'fecha': fecha.toIso8601String(),
        'ubicacion': {
          'lat': lat,
          'lng': lng,
          'direccion': direccion,
          'municipio': municipio,
          'estado': estado,
        },
        'descripcion': descripcion,
        'sincronizado': true,
      };
}
