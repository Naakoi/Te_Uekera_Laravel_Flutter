import 'package:mobile/data/datasources/database_helper.dart';
import 'package:mobile/data/models/document_model.dart';

/// Handles all SQLite persistence of [DocumentModel] objects.
class DocumentLocalDataSource {
  final DatabaseHelper _db;

  DocumentLocalDataSource({DatabaseHelper? databaseHelper})
    : _db = databaseHelper ?? DatabaseHelper.instance;

  /// Persist a fresh list of documents fetched from the server.
  Future<void> cacheDocuments(List<DocumentModel> documents) async {
    final rows = documents.map(_modelToRow).toList();
    await _db.upsertDocuments(rows);
  }

  /// Retrieve all locally cached documents.
  Future<List<DocumentModel>> getCachedDocuments() async {
    final rows = await _db.getAllDocuments();
    return rows.map(_rowToModel).toList();
  }

  /// Retrieve a single locally cached document.
  Future<DocumentModel?> getCachedDocumentById(int id) async {
    final row = await _db.getDocumentById(id);
    return row != null ? _rowToModel(row) : null;
  }

  /// Mark a document as fully downloaded for offline reading.
  Future<void> markAsDownloaded(int documentId) async {
    await _db.markAsDownloaded(documentId);
  }

  /// Returns true if the document pages have been fully downloaded.
  Future<bool> isDocumentDownloaded(int documentId) async {
    return _db.isDownloaded(documentId);
  }

  /// Remove all cached documents (e.g. on logout).
  Future<void> clearAll() async {
    await _db.clearDocuments();
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  Map<String, dynamic> _modelToRow(DocumentModel doc) => {
    'id': doc.id,
    'title': doc.title,
    'description': doc.description,
    'file_path': doc.filePath,
    'thumbnail_path': doc.thumbnailPath,
    'price': doc.price,
    'published_at': doc.publishedAt?.toIso8601String(),
    'has_access': doc.hasAccess ? 1 : 0,
    'page_count': doc.pageCount,
    // preserve existing is_downloaded flag — upsert via DatabaseHelper
    // uses ConflictAlgorithm.replace which will reset it, so we keep it:
    'is_downloaded': doc.isDownloaded ? 1 : 0,
  };

  DocumentModel _rowToModel(Map<String, dynamic> row) => DocumentModel(
    id: row['id'] as int,
    title: row['title'] as String,
    description: row['description'] as String?,
    filePath: row['file_path'] as String?,
    thumbnailPath: row['thumbnail_path'] as String?,
    price: row['price'] as String,
    publishedAt: row['published_at'] != null
        ? DateTime.parse(row['published_at'] as String)
        : null,
    hasAccess: (row['has_access'] as int?) == 1,
    pageCount: row['page_count'] as int?,
    isDownloaded: (row['is_downloaded'] as int?) == 1,
  );
}
