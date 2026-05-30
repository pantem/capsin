class CaracteristicaTipo {
  final String id;
  final String tipoInmuebleId;
  final String nombre;
  final String tipoDato;
  final List<String> opciones;
  final bool requerido;
  final int orden;

  CaracteristicaTipo({
    required this.id,
    required this.tipoInmuebleId,
    required this.nombre,
    required this.tipoDato,
    this.opciones = const [],
    this.requerido = false,
    this.orden = 0,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'tipoInmuebleId': tipoInmuebleId,
        'nombre': nombre,
        'tipoDato': tipoDato,
        'opciones': opciones.join(','),
        'requerido': requerido ? 1 : 0,
        'orden': orden,
      };

  factory CaracteristicaTipo.fromMap(Map<String, dynamic> map) => CaracteristicaTipo(
        id: map['id'] as String,
        tipoInmuebleId: map['tipoInmuebleId'] as String,
        nombre: map['nombre'] as String,
        tipoDato: map['tipoDato'] as String,
        opciones: (map['opciones'] as String?)?.isNotEmpty == true
            ? (map['opciones'] as String).split(',')
            : [],
        requerido: (map['requerido'] as int? ?? 0) == 1,
        orden: map['orden'] as int? ?? 0,
      );

  Map<String, dynamic> toJson() => {
        'nombre': nombre,
        'tipo_dato': tipoDato,
        'opciones': opciones,
        'requerido': requerido,
        'orden': orden,
      };
}
