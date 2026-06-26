import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/registro.dart';

class DatabaseService {
  static Database? _db;

  Future<Database> get database async {
    if (_db != null) return _db!;
    _db = await _init();
    return _db!;
  }

  Future<Database> _init() async {
    final dbPath = await getDatabasesPath();
    return openDatabase(
      join(dbPath, 'beta_siniestros.db'),
      version: 1,
      onCreate: (db, _) async {
        await db.execute('''
          CREATE TABLE registros (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            folio TEXT NOT NULL,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            calle TEXT NOT NULL,
            numero TEXT NOT NULL,
            fecha TEXT NOT NULL,
            sincronizado INTEGER NOT NULL DEFAULT 0
          )
        ''');
      },
    );
  }

  Future<int> insertar(Registro r) async {
    final db = await database;
    return db.insert('registros', r.toMap());
  }

  Future<List<Registro>> obtenerTodos() async {
    final db = await database;
    final maps = await db.query('registros', orderBy: 'fecha DESC');
    return maps.map(Registro.fromMap).toList();
  }

  Future<List<Registro>> obtenerPendientes() async {
    final db = await database;
    final maps = await db.query('registros', where: 'sincronizado = 0');
    return maps.map(Registro.fromMap).toList();
  }

  Future<int> marcarSincronizado(int id) async {
    final db = await database;
    return db.update('registros', {'sincronizado': 1}, where: 'id = ?', whereArgs: [id]);
  }

  Future<int> eliminar(int id) async {
    final db = await database;
    return db.delete('registros', where: 'id = ?', whereArgs: [id]);
  }
}
