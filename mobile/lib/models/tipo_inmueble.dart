class TipoInmueble {
  final String id;
  final String nombre;
  final String descripcion;
  final bool activo;

  TipoInmueble({
    required this.id,
    required this.nombre,
    this.descripcion = '',
    this.activo = true,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'nombre': nombre,
        'descripcion': descripcion,
        'activo': activo ? 1 : 0,
      };

  factory TipoInmueble.fromMap(Map<String, dynamic> map) => TipoInmueble(
        id: map['id'] as String,
        nombre: map['nombre'] as String,
        descripcion: map['descripcion'] as String? ?? '',
        activo: (map['activo'] as int? ?? 1) == 1,
      );

  factory TipoInmueble.fromJson(Map<String, dynamic> json) => TipoInmueble(
        id: json['_id'] as String,
        nombre: json['nombre'] as String,
        descripcion: json['descripcion'] as String? ?? '',
        activo: json['activo'] as bool? ?? true,
      );
}
