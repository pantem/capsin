class InmueblePadron {
  final String id;
  final String nombre;
  final String tipoInmuebleId;
  final String direccion;
  final String colonia;
  final String alcaldia;
  final String codigoPostal;
  final String entreCalles;
  final String personaContactada;
  final String decadaConstruccion;
  final String usoInmueble;
  final int niveles;
  final int sotanos;
  final int ocupantes;
  final String tipoInspeccion;
  final double? lat;
  final double? lng;
  final String estadoAfectacion;
  final DateTime? fechaUltimoReporte;
  final bool activo;

  InmueblePadron({
    required this.id,
    required this.nombre,
    this.tipoInmuebleId = '',
    this.direccion = '',
    this.colonia = '',
    this.alcaldia = '',
    this.codigoPostal = '',
    this.entreCalles = '',
    this.personaContactada = '',
    this.decadaConstruccion = '',
    this.usoInmueble = '',
    this.niveles = 1,
    this.sotanos = 0,
    this.ocupantes = 0,
    this.tipoInspeccion = '',
    this.lat,
    this.lng,
    this.estadoAfectacion = 'sin_daños',
    this.fechaUltimoReporte,
    this.activo = true,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'nombre': nombre,
        'tipoInmuebleId': tipoInmuebleId,
        'direccion': direccion,
        'colonia': colonia,
        'alcaldia': alcaldia,
        'codigoPostal': codigoPostal,
        'entreCalles': entreCalles,
        'personaContactada': personaContactada,
        'decadaConstruccion': decadaConstruccion,
        'usoInmueble': usoInmueble,
        'niveles': niveles,
        'sotanos': sotanos,
        'ocupantes': ocupantes,
        'tipoInspeccion': tipoInspeccion,
        'lat': lat,
        'lng': lng,
        'estadoAfectacion': estadoAfectacion,
        'fechaUltimoReporte': fechaUltimoReporte?.toIso8601String(),
        'activo': activo ? 1 : 0,
      };

  factory InmueblePadron.fromMap(Map<String, dynamic> map) => InmueblePadron(
        id: map['id'] as String,
        nombre: map['nombre'] as String? ?? '',
        tipoInmuebleId: map['tipoInmuebleId'] as String? ?? '',
        direccion: map['direccion'] as String? ?? '',
        colonia: map['colonia'] as String? ?? '',
        alcaldia: map['alcaldia'] as String? ?? '',
        codigoPostal: map['codigoPostal'] as String? ?? '',
        entreCalles: map['entreCalles'] as String? ?? '',
        personaContactada: map['personaContactada'] as String? ?? '',
        decadaConstruccion: map['decadaConstruccion'] as String? ?? '',
        usoInmueble: map['usoInmueble'] as String? ?? '',
        niveles: map['niveles'] as int? ?? 1,
        sotanos: map['sotanos'] as int? ?? 0,
        ocupantes: map['ocupantes'] as int? ?? 0,
        tipoInspeccion: map['tipoInspeccion'] as String? ?? '',
        lat: (map['lat'] as num?)?.toDouble(),
        lng: (map['lng'] as num?)?.toDouble(),
        estadoAfectacion: map['estadoAfectacion'] as String? ?? 'sin_daños',
        fechaUltimoReporte: map['fechaUltimoReporte'] != null
            ? DateTime.tryParse(map['fechaUltimoReporte'] as String)
            : null,
        activo: (map['activo'] as int? ?? 1) == 1,
      );

  factory InmueblePadron.fromJson(Map<String, dynamic> json) => InmueblePadron(
        id: json['_id'] as String? ?? json['id'] as String? ?? '',
        nombre: json['nombre'] as String? ?? '',
        tipoInmuebleId: json['tipo_inmueble_ref'] as String? ?? '',
        direccion: json['direccion'] as String? ?? '',
        colonia: json['colonia'] as String? ?? '',
        alcaldia: json['alcaldia'] as String? ?? '',
        codigoPostal: json['codigo_postal'] as String? ?? '',
        entreCalles: json['entre_calles'] as String? ?? '',
        personaContactada: json['persona_contactada'] as String? ?? '',
        decadaConstruccion: json['decada_construccion'] as String? ?? '',
        usoInmueble: json['uso_inmueble'] as String? ?? '',
        niveles: json['niveles'] as int? ?? 1,
        sotanos: json['sotanos'] as int? ?? 0,
        ocupantes: json['ocupantes'] as int? ?? 0,
        tipoInspeccion: json['tipo_inspeccion'] as String? ?? '',
        lat: (json['ubicacion'] as Map<String, dynamic>?)?['coordinates'] != null
            ? ((json['ubicacion']['coordinates'] as List).length > 1
                ? (json['ubicacion']['coordinates'][1] as num?)?.toDouble()
                : null)
            : null,
        lng: (json['ubicacion'] as Map<String, dynamic>?)?['coordinates'] != null
            ? ((json['ubicacion']['coordinates'] as List).isNotEmpty
                ? (json['ubicacion']['coordinates'][0] as num?)?.toDouble()
                : null)
            : null,
        estadoAfectacion: json['estado_afectacion'] as String? ?? 'sin_daños',
        fechaUltimoReporte: json['fecha_ultimo_reporte'] != null
            ? DateTime.tryParse(json['fecha_ultimo_reporte'] as String)
            : null,
        activo: json['activo'] as bool? ?? true,
      );

  Map<String, dynamic> toJson() => {
        'nombre': nombre,
        'tipo_inmueble_ref': tipoInmuebleId.isEmpty ? null : tipoInmuebleId,
        'direccion': direccion,
        'colonia': colonia,
        'alcaldia': alcaldia,
        'codigo_postal': codigoPostal,
        'entre_calles': entreCalles,
        'persona_contactada': personaContactada,
        'decada_construccion': decadaConstruccion,
        'uso_inmueble': usoInmueble,
        'niveles': niveles,
        'sotanos': sotanos,
        'ocupantes': ocupantes,
        'tipo_inspeccion': tipoInspeccion,
        'lat': lat,
        'lng': lng,
      };
}
