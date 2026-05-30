import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:uuid/uuid.dart';
import '../models/siniestro.dart';
import '../models/inmueble.dart';
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
      version: 3,
      onCreate: _createTables,
      onUpgrade: _onUpgrade,
    );
  }

  Future<void> _crearTiposDefecto(Database db) async {
    final uuid = const Uuid();
    await db.insert('tipos_inmueble', {
      'id': uuid.v4(), 'nombre': 'Casa', 'descripcion': 'Vivienda unifamiliar', 'activo': 1,
    });
    await db.insert('tipos_inmueble', {
      'id': uuid.v4(), 'nombre': 'Edificio', 'descripcion': 'Edificio de departamentos u oficinas', 'activo': 1,
    });
    await db.insert('tipos_inmueble', {
      'id': uuid.v4(), 'nombre': 'Local Comercial', 'descripcion': 'Espacio comercial o negocio', 'activo': 1,
    });
    await db.insert('tipos_inmueble', {
      'id': uuid.v4(), 'nombre': 'Bodega', 'descripcion': 'Almacén o bodega', 'activo': 1,
    });
  }

  Future<void> _createTables(Database db, int version) async {
    await db.execute('''
      CREATE TABLE siniestros (
        id TEXT PRIMARY KEY,
        folio TEXT NOT NULL,
        fecha TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        direccion TEXT DEFAULT '',
        municipio TEXT DEFAULT '',
        estado TEXT DEFAULT '',
        descripcion TEXT DEFAULT '',
        sincronizado INTEGER DEFAULT 0
      )
    ''');
    await db.execute('''
      CREATE TABLE inmuebles (
        id TEXT PRIMARY KEY,
        siniestroId TEXT NOT NULL,
        tipo TEXT DEFAULT '',
        tipoInmuebleId TEXT,
        numeroNiveles INTEGER DEFAULT 1,
        tipoUnidad TEXT DEFAULT '',
        esPadre INTEGER DEFAULT 0,
        padreId TEXT,
        identificador TEXT DEFAULT '',
        estadoAfectacion TEXT DEFAULT 'sin_daños',
        observaciones TEXT DEFAULT '',
        sincronizado INTEGER DEFAULT 0,
        FOREIGN KEY (siniestroId) REFERENCES siniestros(id)
      )
    ''');
    await db.execute('''
      CREATE TABLE damnificados (
        id TEXT PRIMARY KEY,
        inmuebleId TEXT NOT NULL,
        nombre TEXT DEFAULT '',
        edad INTEGER DEFAULT 0,
        sexo TEXT DEFAULT '',
        tipoIdentificacion TEXT DEFAULT '',
        numeroIdentificacion TEXT DEFAULT '',
        estado TEXT DEFAULT 'ileso',
        requiereTraslado INTEGER DEFAULT 0,
        observaciones TEXT DEFAULT '',
        sincronizado INTEGER DEFAULT 0,
        FOREIGN KEY (inmuebleId) REFERENCES inmuebles(id)
      )
    ''');
    await db.execute('''
      CREATE TABLE tipos_inmueble (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL UNIQUE,
        descripcion TEXT DEFAULT '',
        activo INTEGER DEFAULT 1
      )
    ''');
    await _crearTiposDefecto(db);
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
        inmuebleId TEXT NOT NULL,
        caracteristicaId TEXT NOT NULL,
        valorTexto TEXT,
        valorNumero REAL,
        valorBooleano INTEGER,
        valorSeleccion TEXT,
        FOREIGN KEY (inmuebleId) REFERENCES inmuebles(id),
        FOREIGN KEY (caracteristicaId) REFERENCES caracteristicas_tipo(id)
      )
    ''');
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      try {
        await db.execute('ALTER TABLE inmuebles ADD COLUMN tipoInmuebleId TEXT');
      } catch (_) {}
      await db.execute('''
        CREATE TABLE IF NOT EXISTS tipos_inmueble (
          id TEXT PRIMARY KEY,
          nombre TEXT NOT NULL UNIQUE,
          descripcion TEXT DEFAULT '',
          activo INTEGER DEFAULT 1
        )
      ''');
      await db.execute('''
        CREATE TABLE IF NOT EXISTS caracteristicas_tipo (
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
        CREATE TABLE IF NOT EXISTS valores_caracteristica (
          id TEXT PRIMARY KEY,
          inmuebleId TEXT NOT NULL,
          caracteristicaId TEXT NOT NULL,
          valorTexto TEXT,
          valorNumero REAL,
          valorBooleano INTEGER,
          valorSeleccion TEXT,
          FOREIGN KEY (inmuebleId) REFERENCES inmuebles(id),
          FOREIGN KEY (caracteristicaId) REFERENCES caracteristicas_tipo(id)
        )
      ''');
      final count = Sqflite.firstIntValue(await db.rawQuery('SELECT COUNT(*) FROM tipos_inmueble'));
      if (count == 0) {
        await _crearTiposDefecto(db);
      }
    }
    if (oldVersion < 3) {
      final count = Sqflite.firstIntValue(await db.rawQuery('SELECT COUNT(*) FROM tipos_inmueble'));
      if (count == 0) {
        await _crearTiposDefecto(db);
      }
    }
  }

  Future<String> insertSiniestro(Siniestro s) async {
    final db = await database;
    await db.insert('siniestros', s.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    return s.id;
  }

  Future<List<Siniestro>> getSiniestros() async {
    final db = await database;
    final maps = await db.query('siniestros', orderBy: 'fecha DESC');
    return maps.map((m) => Siniestro.fromMap(m)).toList();
  }

  Future<Siniestro?> getSiniestro(String id) async {
    final db = await database;
    final maps = await db.query('siniestros', where: 'id = ?', whereArgs: [id]);
    if (maps.isEmpty) return null;
    return Siniestro.fromMap(maps.first);
  }

  Future<List<Siniestro>> getSiniestrosNoSincronizados() async {
    final db = await database;
    final maps = await db.query('siniestros', where: 'sincronizado = 0');
    return maps.map((m) => Siniestro.fromMap(m)).toList();
  }

  Future<void> marcarSiniestroSincronizado(String id) async {
    final db = await database;
    await db.update('siniestros', {'sincronizado': 1}, where: 'id = ?', whereArgs: [id]);
  }

  Future<String> insertInmueble(Inmueble i) async {
    final db = await database;
    await db.insert('inmuebles', i.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    return i.id;
  }

  Future<List<Inmueble>> getInmuebles(String siniestroId) async {
    final db = await database;
    final maps = await db.query('inmuebles', where: 'siniestroId = ?', whereArgs: [siniestroId]);
    return maps.map((m) => Inmueble.fromMap(m)).toList();
  }

  Future<Inmueble?> getInmueble(String id) async {
    final db = await database;
    final maps = await db.query('inmuebles', where: 'id = ?', whereArgs: [id]);
    if (maps.isEmpty) return null;
    return Inmueble.fromMap(maps.first);
  }

  Future<List<Inmueble>> getInmueblesHijos(String padreId) async {
    final db = await database;
    final maps = await db.query('inmuebles', where: 'padreId = ?', whereArgs: [padreId]);
    return maps.map((m) => Inmueble.fromMap(m)).toList();
  }

  Future<List<Inmueble>> getInmueblesNoSincronizados() async {
    final db = await database;
    final maps = await db.query('inmuebles', where: 'sincronizado = 0');
    return maps.map((m) => Inmueble.fromMap(m)).toList();
  }

  Future<void> marcarInmuebleSincronizado(String id) async {
    final db = await database;
    await db.update('inmuebles', {'sincronizado': 1}, where: 'id = ?', whereArgs: [id]);
  }

  Future<String> insertDamnificado(Damnificado d) async {
    final db = await database;
    await db.insert('damnificados', d.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    return d.id;
  }

  Future<List<Damnificado>> getDamnificados(String inmuebleId) async {
    final db = await database;
    final maps = await db.query('damnificados', where: 'inmuebleId = ?', whereArgs: [inmuebleId]);
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

  Future<void> deleteSiniestro(String id) async {
    final db = await database;
    final inmuebles = await getInmuebles(id);
    for (final i in inmuebles) {
      await db.delete('valores_caracteristica', where: 'inmuebleId = ?', whereArgs: [i.id]);
      await db.delete('damnificados', where: 'inmuebleId = ?', whereArgs: [i.id]);
    }
    await db.delete('inmuebles', where: 'siniestroId = ?', whereArgs: [id]);
    await db.delete('siniestros', where: 'id = ?', whereArgs: [id]);
  }

  Future<String> insertTipoInmueble(TipoInmueble t) async {
    final db = await database;
    await db.insert('tipos_inmueble', t.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    return t.id;
  }

  Future<List<TipoInmueble>> getTiposInmueble({bool soloActivos = false}) async {
    final db = await database;
    final maps = soloActivos
        ? await db.query('tipos_inmueble', where: 'activo = 1', orderBy: 'nombre ASC')
        : await db.query('tipos_inmueble', orderBy: 'nombre ASC');
    return maps.map((m) => TipoInmueble.fromMap(m)).toList();
  }

  Future<TipoInmueble?> getTipoInmueble(String id) async {
    final db = await database;
    final maps = await db.query('tipos_inmueble', where: 'id = ?', whereArgs: [id]);
    if (maps.isEmpty) return null;
    return TipoInmueble.fromMap(maps.first);
  }

  Future<void> updateTipoInmueble(TipoInmueble t) async {
    final db = await database;
    await db.update('tipos_inmueble', t.toMap(), where: 'id = ?', whereArgs: [t.id]);
  }

  Future<void> deleteTipoInmueble(String id) async {
    final db = await database;
    await db.delete('caracteristicas_tipo', where: 'tipoInmuebleId = ?', whereArgs: [id]);
    await db.delete('tipos_inmueble', where: 'id = ?', whereArgs: [id]);
  }

  Future<String> insertCaracteristica(CaracteristicaTipo c) async {
    final db = await database;
    await db.insert('caracteristicas_tipo', c.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    return c.id;
  }

  Future<List<CaracteristicaTipo>> getCaracteristicas(String tipoInmuebleId) async {
    final db = await database;
    final maps = await db.query('caracteristicas_tipo',
        where: 'tipoInmuebleId = ?', whereArgs: [tipoInmuebleId], orderBy: 'orden ASC');
    return maps.map((m) => CaracteristicaTipo.fromMap(m)).toList();
  }

  Future<void> updateCaracteristica(CaracteristicaTipo c) async {
    final db = await database;
    await db.update('caracteristicas_tipo', c.toMap(), where: 'id = ?', whereArgs: [c.id]);
  }

  Future<void> deleteCaracteristica(String id) async {
    final db = await database;
    await db.delete('valores_caracteristica', where: 'caracteristicaId = ?', whereArgs: [id]);
    await db.delete('caracteristicas_tipo', where: 'id = ?', whereArgs: [id]);
  }

  Future<String> insertValorCaracteristica(ValorCaracteristica v) async {
    final db = await database;
    await db.insert('valores_caracteristica', v.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    return v.id;
  }

  Future<void> insertValoresCaracteristica(List<ValorCaracteristica> valores) async {
    final db = await database;
    final batch = db.batch();
    for (final v in valores) {
      batch.insert('valores_caracteristica', v.toMap(), conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  Future<List<ValorCaracteristica>> getValoresCaracteristica(String inmuebleId) async {
    final db = await database;
    final maps = await db.query('valores_caracteristica',
        where: 'inmuebleId = ?', whereArgs: [inmuebleId]);
    return maps.map((m) => ValorCaracteristica.fromMap(m)).toList();
  }

  Future<void> deleteValoresCaracteristica(String inmuebleId) async {
    final db = await database;
    await db.delete('valores_caracteristica', where: 'inmuebleId = ?', whereArgs: [inmuebleId]);
  }
}
