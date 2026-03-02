import 'package:flutter/foundation.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._internal();
  static Database? _database;

  DatabaseHelper._internal();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    // Use FFI for Linux/Windows/macOS desktop; native sqflite on Android/iOS
    if (!kIsWeb &&
        (defaultTargetPlatform == TargetPlatform.linux ||
            defaultTargetPlatform == TargetPlatform.windows ||
            defaultTargetPlatform == TargetPlatform.macOS)) {
      sqfliteFfiInit();
      databaseFactory = databaseFactoryFfi;
    }

    final dbDir = await getDatabasesPath();
    final path = '$dbDir/te_uekera.db';
    return await openDatabase(path, version: 1, onCreate: _onCreate);
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE documents (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        file_path TEXT,
        thumbnail_path TEXT,
        price TEXT NOT NULL,
        published_at TEXT,
        has_access INTEGER NOT NULL DEFAULT 0,
        page_count INTEGER,
        is_downloaded INTEGER NOT NULL DEFAULT 0,
        cached_at TEXT NOT NULL
      )
    ''');
  }

  /// Replace all cached documents with a fresh batch from the server.
  Future<void> upsertDocuments(List<Map<String, dynamic>> documents) async {
    final db = await database;
    final batch = db.batch();
    final now = DateTime.now().toIso8601String();
    for (final doc in documents) {
      batch.insert('documents', {
        ...doc,
        'has_access': (doc['has_access'] == true || doc['has_access'] == 1)
            ? 1
            : 0,
        'cached_at': now,
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  /// Return all cached documents.
  Future<List<Map<String, dynamic>>> getAllDocuments() async {
    final db = await database;
    return db.query('documents', orderBy: 'published_at DESC');
  }

  /// Return a single cached document by id.
  Future<Map<String, dynamic>?> getDocumentById(int id) async {
    final db = await database;
    final results = await db.query(
      'documents',
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );
    return results.isNotEmpty ? results.first : null;
  }

  /// Mark a document as having been fully downloaded for offline use.
  Future<void> markAsDownloaded(int documentId) async {
    final db = await database;
    await db.update(
      'documents',
      {'is_downloaded': 1},
      where: 'id = ?',
      whereArgs: [documentId],
    );
  }

  /// Check whether a specific document is downloaded.
  Future<bool> isDownloaded(int documentId) async {
    final db = await database;
    final results = await db.query(
      'documents',
      columns: ['is_downloaded'],
      where: 'id = ?',
      whereArgs: [documentId],
      limit: 1,
    );
    if (results.isEmpty) return false;
    return (results.first['is_downloaded'] as int?) == 1;
  }

  /// Delete all cached documents (e.g. on logout).
  Future<void> clearDocuments() async {
    final db = await database;
    await db.delete('documents');
  }

  Future<void> close() async {
    final db = await database;
    await db.close();
    _database = null;
  }
}
