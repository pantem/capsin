class Damnificado {
  final String id;
  final String inmuebleId;
  final String nombre;
  final int edad;
  final String sexo;
  final String tipoIdentificacion;
  final String numeroIdentificacion;
  final String estado;
  final bool requiereTraslado;
  final String observaciones;
  final bool sincronizado;

  Damnificado({
    required this.id,
    required this.inmuebleId,
    this.nombre = '',
    this.edad = 0,
    this.sexo = '',
    this.tipoIdentificacion = '',
    this.numeroIdentificacion = '',
    this.estado = 'ileso',
    this.requiereTraslado = false,
    this.observaciones = '',
    this.sincronizado = false,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'inmuebleId': inmuebleId,
        'nombre': nombre,
        'edad': edad,
        'sexo': sexo,
        'tipoIdentificacion': tipoIdentificacion,
        'numeroIdentificacion': numeroIdentificacion,
        'estado': estado,
        'requiereTraslado': requiereTraslado ? 1 : 0,
        'observaciones': observaciones,
        'sincronizado': sincronizado ? 1 : 0,
      };

  factory Damnificado.fromMap(Map<String, dynamic> map) => Damnificado(
        id: map['id'] as String,
        inmuebleId: map['inmuebleId'] as String,
        nombre: map['nombre'] as String? ?? '',
        edad: map['edad'] as int? ?? 0,
        sexo: map['sexo'] as String? ?? '',
        tipoIdentificacion: map['tipoIdentificacion'] as String? ?? '',
        numeroIdentificacion: map['numeroIdentificacion'] as String? ?? '',
        estado: map['estado'] as String? ?? 'ileso',
        requiereTraslado: (map['requiereTraslado'] as int? ?? 0) == 1,
        observaciones: map['observaciones'] as String? ?? '',
        sincronizado: (map['sincronizado'] as int? ?? 0) == 1,
      );

  Map<String, dynamic> toJson() => {
        'nombre': nombre,
        'edad': edad,
        'sexo': sexo,
        'tipo_identificacion': tipoIdentificacion,
        'numero_identificacion': numeroIdentificacion,
        'estado': estado,
        'requiere_traslado': requiereTraslado,
        'observaciones': observaciones,
      };
}
