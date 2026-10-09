class CaracteristicaTipo {
  final String id;
  final String tipoInmuebleId;
  final String nombre;
  final String tipoDato;
  final List<String> opciones;
  final bool requerido;
  final int orden;
  final String renderType;
  final String condicionalTexto;
  final bool mostrarTitulo;
  final double? minimo;
  final double? maximo;

  CaracteristicaTipo({
    required this.id,
    required this.tipoInmuebleId,
    required this.nombre,
    required this.tipoDato,
    this.opciones = const [],
    this.requerido = false,
    this.orden = 0,
    this.renderType = 'auto',
    this.condicionalTexto = 'no',
    this.mostrarTitulo = false,
    this.minimo,
    this.maximo,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'tipoInmuebleId': tipoInmuebleId,
        'nombre': nombre,
        'tipoDato': tipoDato,
        'opciones': opciones.join(','),
        'requerido': requerido ? 1 : 0,
        'orden': orden,
        'render_type': renderType,
        'condicional_texto': condicionalTexto,
        'mostrar_titulo': mostrarTitulo ? 1 : 0,
        'minimo': minimo,
        'maximo': maximo,
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
        renderType: map['render_type'] as String? ?? 'auto',
        condicionalTexto: map['condicional_texto'] as String? ?? 'no',
        mostrarTitulo: (map['mostrar_titulo'] as int? ?? 0) == 1,
        minimo: (map['minimo'] as num?)?.toDouble(),
        maximo: (map['maximo'] as num?)?.toDouble(),
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
        renderType: json['render_type'] as String? ?? 'auto',
        condicionalTexto: json['condicional_texto'] as String? ?? 'no',
        mostrarTitulo: json['mostrar_titulo'] as bool? ?? false,
        minimo: (json['minimo'] as num?)?.toDouble(),
        maximo: (json['maximo'] as num?)?.toDouble(),
      );
}
