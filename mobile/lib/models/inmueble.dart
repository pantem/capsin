class Inmueble {
  final String id;
  final String siniestroId;
  final String tipo;
  final String? tipoInmuebleId;
  final int numeroNiveles;
  final String tipoUnidad;
  final bool esPadre;
  final String? padreId;
  final String identificador;
  final String estadoAfectacion;
  final String observaciones;
  final bool sincronizado;

  Inmueble({
    required this.id,
    required this.siniestroId,
    this.tipo = '',
    this.tipoInmuebleId,
    this.numeroNiveles = 1,
    this.tipoUnidad = '',
    this.esPadre = false,
    this.padreId,
    this.identificador = '',
    this.estadoAfectacion = 'sin_daños',
    this.observaciones = '',
    this.sincronizado = false,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'siniestroId': siniestroId,
        'tipo': tipo,
        'tipoInmuebleId': tipoInmuebleId,
        'numeroNiveles': numeroNiveles,
        'tipoUnidad': tipoUnidad,
        'esPadre': esPadre ? 1 : 0,
        'padreId': padreId,
        'identificador': identificador,
        'estadoAfectacion': estadoAfectacion,
        'observaciones': observaciones,
        'sincronizado': sincronizado ? 1 : 0,
      };

  factory Inmueble.fromMap(Map<String, dynamic> map) => Inmueble(
        id: map['id'] as String,
        siniestroId: map['siniestroId'] as String,
        tipo: map['tipo'] as String? ?? '',
        tipoInmuebleId: map['tipoInmuebleId'] as String?,
        numeroNiveles: map['numeroNiveles'] as int? ?? 1,
        tipoUnidad: map['tipoUnidad'] as String? ?? '',
        esPadre: (map['esPadre'] as int? ?? 0) == 1,
        padreId: map['padreId'] as String?,
        identificador: map['identificador'] as String? ?? '',
        estadoAfectacion: map['estadoAfectacion'] as String? ?? 'sin_daños',
        observaciones: map['observaciones'] as String? ?? '',
        sincronizado: (map['sincronizado'] as int? ?? 0) == 1,
      );

  Map<String, dynamic> toJson() => {
        'tipo': tipo,
        'tipo_inmueble_ref': tipoInmuebleId,
        'numero_niveles': numeroNiveles,
        'tipo_unidad': tipoUnidad,
        'es_padre': esPadre,
        'identificador': identificador,
        'estado_afectacion': estadoAfectacion,
        'observaciones': observaciones,
      };
}
