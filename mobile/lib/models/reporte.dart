class Reporte {
  final String id;
  final String folio;
  final DateTime fecha;

  // 1. Datos Generales
  final String nombreCapturista;
  final String area;

  // 2. Información del inmueble afectado
  final String calleNumero;
  final String colonia;
  final String alcaldia;
  final String codigoPostal;
  final double? lat;
  final double? lng;

  // 2.1 Uso del Inmueble
  final String usoInmueble;
  final String? otroUso;
  final String fechaConstruccion;
  final int numeroNiveles;

  // 3. Evaluación preliminar de daños
  final String danosObservados;

  // 4. Condición de seguridad
  final String condicionSeguridad;

  // 5. Observaciones adicionales
  final String observaciones;

  // 6. Fotografías
  final String fotos;

  final bool sincronizado;

  Reporte({
    required this.id,
    required this.folio,
    required this.fecha,
    this.nombreCapturista = '',
    this.area = '',
    this.calleNumero = '',
    this.colonia = '',
    this.alcaldia = '',
    this.codigoPostal = '',
    this.lat,
    this.lng,
    this.usoInmueble = '',
    this.otroUso,
    this.fechaConstruccion = '',
    this.numeroNiveles = 1,
    this.danosObservados = '',
    this.condicionSeguridad = '',
    this.observaciones = '',
    this.fotos = '',
    this.sincronizado = false,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'folio': folio,
        'fecha': fecha.toIso8601String(),
        'nombreCapturista': nombreCapturista,
        'area': area,
        'calleNumero': calleNumero,
        'colonia': colonia,
        'alcaldia': alcaldia,
        'codigoPostal': codigoPostal,
        'lat': lat,
        'lng': lng,
        'usoInmueble': usoInmueble,
        'otroUso': otroUso,
        'fechaConstruccion': fechaConstruccion,
        'numeroNiveles': numeroNiveles,
        'danosObservados': danosObservados,
        'condicionSeguridad': condicionSeguridad,
        'observaciones': observaciones,
        'fotos': fotos,
        'sincronizado': sincronizado ? 1 : 0,
      };

  factory Reporte.fromMap(Map<String, dynamic> map) => Reporte(
        id: map['id'] as String,
        folio: map['folio'] as String,
        fecha: DateTime.parse(map['fecha'] as String),
        nombreCapturista: map['nombreCapturista'] as String? ?? '',
        area: map['area'] as String? ?? '',
        calleNumero: map['calleNumero'] as String? ?? '',
        colonia: map['colonia'] as String? ?? '',
        alcaldia: map['alcaldia'] as String? ?? '',
        codigoPostal: map['codigoPostal'] as String? ?? '',
        lat: (map['lat'] as num?)?.toDouble(),
        lng: (map['lng'] as num?)?.toDouble(),
        usoInmueble: map['usoInmueble'] as String? ?? '',
        otroUso: map['otroUso'] as String?,
        fechaConstruccion: map['fechaConstruccion'] as String? ?? '',
        numeroNiveles: map['numeroNiveles'] as int? ?? 1,
        danosObservados: map['danosObservados'] as String? ?? '',
        condicionSeguridad: map['condicionSeguridad'] as String? ?? '',
        observaciones: map['observaciones'] as String? ?? '',
        fotos: map['fotos'] as String? ?? '',
        sincronizado: (map['sincronizado'] as int? ?? 0) == 1,
      );

  Map<String, dynamic> toJson() => {
        'folio': folio,
        'fecha': fecha.toIso8601String(),
        'nombre_capturista': nombreCapturista,
        'area': area,
        'calle_numero': calleNumero,
        'colonia': colonia,
        'alcaldia': alcaldia,
        'codigo_postal': codigoPostal,
        'lat': lat,
        'lng': lng,
        'uso_inmueble': usoInmueble,
        'otro_uso': otroUso,
        'fecha_construccion': fechaConstruccion,
        'numero_niveles': numeroNiveles,
        'danos_observados': danosObservados,
        'condicion_seguridad': condicionSeguridad,
        'observaciones': observaciones,
        'fotos': fotos,
      };
}
