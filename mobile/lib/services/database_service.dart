import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/reporte.dart';
import '../models/damnificado.dart';

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
      version: 4,
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
    }
  }

  Future<String> insertReporte(Reporte r) async {
    final db = await database;
    await db.insert('reportes', r.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    return r.id;
  }

  Future<List<Reporte>> getReportes() async {
    final db = await database;
    final maps = await db.query('reportes', orderBy: 'fecha DESC');
    return maps.map((m) => Reporte.fromMap(m)).toList();
  }

  Future<Reporte?> getReporte(String id) async {
    final db = await database;
    final maps = await db.query('reportes', where: 'id = ?', whereArgs: [id]);
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
    await db.update('reportes', {'sincronizado': 1}, where: 'id = ?', whereArgs: [id]);
  }

  Future<String> insertDamnificado(Damnificado d) async {
    final db = await database;
    await db.insert('damnificados', d.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    return d.id;
  }

  Future<List<Damnificado>> getDamnificados(String reporteId) async {
    final db = await database;
    final maps = await db.query('damnificados', where: 'reporteId = ?', whereArgs: [reporteId]);
    return maps.map((m) => Damnificado.fromMap(m)).toList();
  }

  Future<List<Damnificado>> getDamnificadosNoSincronizados() async {
    final db = await database;
    final maps = await db.query('damnificados', where: 'sincronizado = 0');
    return maps.map((m) => Damnificado.fromMap(m)).toList();
  }

  Future<void> marcarDamnificadoSincronizado(String id) async {
    final db = await database;
    await db.update('damnificados', {'sincronizado': 1}, where: 'id = ?', whereArgs: [id]);
  }

  Future<void> deleteReporte(String id) async {
    final db = await database;
    await db.delete('damnificados', where: 'reporteId = ?', whereArgs: [id]);
    await db.delete('reportes', where: 'id = ?', whereArgs: [id]);
  }
}
