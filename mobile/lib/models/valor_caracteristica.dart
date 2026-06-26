class ValorCaracteristica {
  final String id;
  final String reporteId;
  final String caracteristicaId;
  final String? valorTexto;
  final double? valorNumero;
  final bool? valorBooleano;
  final String? valorSeleccion;

  ValorCaracteristica({
    required this.id,
    required this.reporteId,
    required this.caracteristicaId,
    this.valorTexto,
    this.valorNumero,
    this.valorBooleano,
    this.valorSeleccion,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'reporteId': reporteId,
        'caracteristicaId': caracteristicaId,
        'valorTexto': valorTexto,
        'valorNumero': valorNumero,
        'valorBooleano':
            valorBooleano == null ? null : (valorBooleano! ? 1 : 0),
        'valorSeleccion': valorSeleccion,
      };

  factory ValorCaracteristica.fromMap(Map<String, dynamic> map) =>
      ValorCaracteristica(
        id: map['id'] as String,
        reporteId: map['reporteId'] as String,
        caracteristicaId: map['caracteristicaId'] as String,
        valorTexto: map['valorTexto'] as String?,
        valorNumero: (map['valorNumero'] as num?)?.toDouble(),
        valorBooleano: map['valorBooleano'] == null
            ? null
            : (map['valorBooleano'] as int) == 1,
        valorSeleccion: map['valorSeleccion'] as String?,
      );

  Map<String, dynamic> toJson() => {
        'caracteristica_id': caracteristicaId,
        'valor_texto': valorTexto,
        'valor_numero': valorNumero,
        'valor_booleano': valorBooleano,
        'valor_seleccion': valorSeleccion,
      };
}
