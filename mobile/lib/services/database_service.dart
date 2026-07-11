import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/reporte.dart';
import '../models/damnificado.dart';
import '../models/tipo_inmueble.dart';
import '../models/caracteristica_tipo.dart';
import '../models/valor_caracteristica.dart';

class DatabaseService {
  static final DatabaseService _instance = DatabaseService._internal();
  factory DatabaseService() => _instance;
  DatabaseService._internal();

  Database? _database;

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB();
    return _database!;
  }

  Future<Database> _initDB() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'siniestros_sismo.db');
    return openDatabase(
      path,
      version: 6,
      onCreate: _createTables,
      onUpgrade: _onUpgrade,
    );
  }

  Future<void> _createTables(Database db, int version) async {
    await db.execute('''
      CREATE TABLE reportes (
        id TEXT PRIMARY KEY,
        folio TEXT NOT NULL,
        fecha TEXT NOT NULL,
        nombreCapturista TEXT DEFAULT '',
        area TEXT DEFAULT '',
        calleNumero TEXT DEFAULT '',
        colonia TEXT DEFAULT '',
        alcaldia TEXT DEFAULT '',
        codigoPostal TEXT DEFAULT '',
        lat REAL,
        lng REAL,
        usoInmueble TEXT DEFAULT '',
        otroUso TEXT,
        fechaConstruccion TEXT DEFAULT '',
        numeroNiveles INTEGER DEFAULT 1,
        danosObservados TEXT DEFAULT '',
        condicionSeguridad TEXT DEFAULT '',
        observaciones TEXT DEFAULT '',
        fotos TEXT DEFAULT '',
        estadoAfectacion TEXT DEFAULT 'sin_daños',
        sincronizado INTEGER DEFAULT 0
      )
    ''');
    await db.execute('''
      CREATE TABLE damnificados (
        id TEXT PRIMARY KEY,
        reporteId TEXT NOT NULL,
        nombre TEXT DEFAULT '',
        edad INTEGER DEFAULT 0,
        sexo TEXT DEFAULT '',
        tipoIdentificacion TEXT DEFAULT '',
        numeroIdentificacion TEXT DEFAULT '',
        estado TEXT DEFAULT 'ileso',
        requiereTraslado INTEGER DEFAULT 0,
        observaciones TEXT DEFAULT '',
        sincronizado INTEGER DEFAULT 0,
        FOREIGN KEY (reporteId) REFERENCES reportes(id)
      )
    ''');
    await _crearTablasDinamicas(db);
  }

  Future<void> _crearTablasDinamicas(Database db) async {
    await db.execute('''
      CREATE TABLE tipos_inmueble (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL UNIQUE,
        descripcion TEXT DEFAULT '',
        activo INTEGER DEFAULT 1
      )
    ''');
    await db.execute('''
      CREATE TABLE caracteristicas_tipo (
        id TEXT PRIMARY KEY,
        tipoInmuebleId TEXT NOT NULL,
        nombre TEXT NOT NULL,
        tipoDato TEXT NOT NULL,
        opciones TEXT DEFAULT '',
        requerido INTEGER DEFAULT 0,
        orden INTEGER DEFAULT 0,
        FOREIGN KEY (tipoInmuebleId) REFERENCES tipos_inmueble(id)
      )
    ''');
    await db.execute('''
      CREATE TABLE valores_caracteristica (
        id TEXT PRIMARY KEY,
        reporteId TEXT NOT NULL,
        caracteristicaId TEXT NOT NULL,
        valorTexto TEXT,
        valorNumero REAL,
        valorBooleano INTEGER,
        valorSeleccion TEXT,
        FOREIGN KEY (reporteId) REFERENCES reportes(id),
        FOREIGN KEY (caracteristicaId) REFERENCES caracteristicas_tipo(id)
      )
    ''');
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 4) {
      await db.execute('DROP TABLE IF EXISTS valores_caracteristica');
      await db.execute('DROP TABLE IF EXISTS caracteristicas_tipo');
      await db.execute('DROP TABLE IF EXISTS tipos_inmueble');
      await db.execute('DROP TABLE IF EXISTS inmuebles');
      await db.execute('DROP TABLE IF EXISTS siniestros');
      await db.execute('DROP TABLE IF EXISTS damnificados');
      await _createTables(db, newVersion);
      return;
    }
    if (oldVersion == 4) {
      await _crearTablasDinamicas(db);
    }
    if (oldVersion < 6) {
      try {
        await db.execute('ALTER TABLE reportes ADD COLUMN estadoAfectacion TEXT DEFAULT \'sin_daños\'');
      } catch (_) {}
    }
  }

  Future<String> insertReporte(Reporte r) async {
    final db = await database;
    await db.insert('reportes', r.toMap(),
        conflictAlgorithm: ConflictAlgorithm.replace);
    return r.id;
  }

  Future<List<Reporte>> getReportes() async {
    final db = await database;
    final maps = await db.query('reportes', orderBy: 'fecha DESC');
    return maps.map((m) => Reporte.fromMap(m)).toList();
  }

  Future<Reporte?> getReporte(String id) async {
    final db = await database;
    final maps =
        await db.query('reportes', where: 'id = ?', whereArgs: [id]);
    if (maps.isEmpty) return null;
    return Reporte.fromMap(maps.first);
  }

  Future<List<Reporte>> getReportesNoSincronizados() async {
    final db = await database;
    final maps = await db.query('reportes', where: 'sincronizado = 0');
    return maps.map((m) => Reporte.fromMap(m)).toList();
  }

  Future<void> marcarReporteSincronizado(String id) async {
    final db = await database;
    await db.update('reportes', {'sincronizado': 1},
        where: 'id = ?', whereArgs: [id]);
  }

  Future<String> insertDamnificado(Damnificado d) async {
    final db = await database;
    await db.insert('damnificados', d.toMap(),
        conflictAlgorithm: ConflictAlgorithm.replace);
    return d.id;
  }

  Future<List<Damnificado>> getDamnificados(String reporteId) async {
    final db = await database;
    final maps = await db.query('damnificados',
        where: 'reporteId = ?', whereArgs: [reporteId]);
    return maps.map((m) => Damnificado.fromMap(m)).toList();
  }

  Future<List<Damnificado>> getDamnificadosNoSincronizados() async {
    final db = await database;
    final maps = await db.query('damnificados', where: 'sincronizado = 0');
    return maps.map((m) => Damnificado.fromMap(m)).toList();
  }

  Future<void> marcarDamnificadoSincronizado(String id) async {
    final db = await database;
    await db.update('damnificados', {'sincronizado': 1},
        where: 'id = ?', whereArgs: [id]);
  }

  Future<void> deleteReporte(String id) async {
    final db = await database;
    await db
        .delete('valores_caracteristica', where: 'reporteId = ?', whereArgs: [id]);
    await db.delete('damnificados', where: 'reporteId = ?', whereArgs: [id]);
    await db.delete('reportes', where: 'id = ?', whereArgs: [id]);
  }

  Future<void> insertTiposInmueble(List<TipoInmueble> tipos) async {
    final db = await database;
    await db.delete('tipos_inmueble');
    for (final t in tipos) {
      await db.insert('tipos_inmueble', t.toMap(),
          conflictAlgorithm: ConflictAlgorithm.replace);
    }
  }

  Future<List<TipoInmueble>> getTiposInmueble({bool soloActivos = false}) async {
    final db = await database;
    final maps = soloActivos
        ? await db.query('tipos_inmueble',
            where: 'activo = 1', orderBy: 'nombre ASC')
        : await db.query('tipos_inmueble', orderBy: 'nombre ASC');
    return maps.map((m) => TipoInmueble.fromMap(m)).toList();
  }

  Future<TipoInmueble?> getTipoInmueblePorNombre(String nombre) async {
    final db = await database;
    final maps = await db.query('tipos_inmueble',
        where: 'nombre = ?', whereArgs: [nombre]);
    if (maps.isEmpty) return null;
    return TipoInmueble.fromMap(maps.first);
  }

  Future<void> insertCaracteristicas(
      String tipoInmuebleId, List<CaracteristicaTipo> caracteristicas) async {
    final db = await database;
    await db.delete('caracteristicas_tipo',
        where: 'tipoInmuebleId = ?', whereArgs: [tipoInmuebleId]);
    for (final c in caracteristicas) {
      await db.insert('caracteristicas_tipo', c.toMap(),
          conflictAlgorithm: ConflictAlgorithm.replace);
    }
  }

  Future<List<CaracteristicaTipo>> getCaracteristicas(
      String tipoInmuebleId) async {
    final db = await database;
    final maps = await db.query('caracteristicas_tipo',
        where: 'tipoInmuebleId = ?',
        whereArgs: [tipoInmuebleId],
        orderBy: 'orden ASC');
    return maps.map((m) => CaracteristicaTipo.fromMap(m)).toList();
  }

  Future<List<CaracteristicaTipo>> getTodasCaracteristicas() async {
    final db = await database;
    final maps =
        await db.query('caracteristicas_tipo', orderBy: 'tipoInmuebleId, orden ASC');
    return maps.map((m) => CaracteristicaTipo.fromMap(m)).toList();
  }

  Future<void> insertValoresCaracteristica(
      List<ValorCaracteristica> valores) async {
    final db = await database;
    await db.delete('valores_caracteristica',
        where: 'reporteId = ?', whereArgs: [
      valores.isNotEmpty ? valores.first.reporteId : ''
    ]);
    for (final v in valores) {
      await db.insert('valores_caracteristica', v.toMap(),
          conflictAlgorithm: ConflictAlgorithm.replace);
    }
  }

  Future<List<ValorCaracteristica>> getValoresCaracteristica(
      String reporteId) async {
    final db = await database;
    final maps = await db.query('valores_caracteristica',
        where: 'reporteId = ?', whereArgs: [reporteId]);
    return maps.map((m) => ValorCaracteristica.fromMap(m)).toList();
  }
}
