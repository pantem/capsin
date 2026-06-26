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

  factory CaracteristicaTipo.fromMap(Map<String, dynamic> map) =>
      CaracteristicaTipo(
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

  factory CaracteristicaTipo.fromJson(Map<String, dynamic> json) =>
      CaracteristicaTipo(
        id: json['_id'] as String,
        tipoInmuebleId: json['tipo_inmueble'] as String? ?? '',
        nombre: json['nombre'] as String,
        tipoDato: json['tipo_dato'] as String,
        opciones: (json['opciones'] as List<dynamic>?)
                ?.map((e) => e as String)
                .toList() ??
            [],
        requerido: json['requerido'] as bool? ?? false,
        orden: json['orden'] as int? ?? 0,
      );
}
