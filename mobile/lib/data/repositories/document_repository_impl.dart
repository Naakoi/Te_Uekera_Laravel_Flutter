import 'package:flutter/foundation.dart';
import 'package:mobile/data/datasources/document_remote_datasource.dart';
import 'package:mobile/data/datasources/document_local_datasource.dart';
import 'package:mobile/data/models/document_model.dart';
import 'package:mobile/domain/repositories/document_repository.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mobile/core/utils/api_client.dart';

class DocumentRepositoryImpl implements DocumentRepository {
  final DocumentRemoteDataSource remoteDataSource;
  final DocumentLocalDataSource localDataSource;

  DocumentRepositoryImpl({
    required this.remoteDataSource,
    DocumentLocalDataSource? localDataSource,
  }) : localDataSource = localDataSource ?? DocumentLocalDataSource();

  /// Fetch documents from server and cache in SQLite.
  /// Falls back to the local SQLite cache when offline.
  @override
  Future<List<DocumentModel>> getDocuments() async {
    try {
      final remoteDocuments = await remoteDataSource.getDocuments();

      if (!kIsWeb) {
        try {
          // Before syncing, read which documents are already downloaded
          // so we can preserve the flag across the upsert.
          final existingCached = await localDataSource.getCachedDocuments();
          final downloadedIds = {
            for (final d in existingCached)
              if (d.isDownloaded) d.id,
          };

          // Merge the isDownloaded state into the fresh server response
          final merged = remoteDocuments.map((doc) {
            return downloadedIds.contains(doc.id)
                ? doc.copyWith(isDownloaded: true)
                : doc;
          }).toList();

          await localDataSource.cacheDocuments(merged);
          return merged;
        } catch (e) {
          debugPrint('DocumentRepositoryImpl: Error caching to SQLite: $e');
        }
      }

      return remoteDocuments;
    } catch (e) {
      // Network/server unavailable – fall back to SQLite cache
      rethrow;
    }
  }

  /// Return documents from SQLite (used when offline).
  @override
  Future<List<DocumentModel>> getCachedDocuments() async {
    if (kIsWeb) return [];
    return localDataSource.getCachedDocuments();
  }

  @override
  Future<DocumentModel> getDocumentById(int id) async {
    try {
      return await remoteDataSource.getDocumentById(id);
    } catch (_) {
      // Fallback to local cache
      final cached = await localDataSource.getCachedDocumentById(id);
      if (cached != null) return cached;
      rethrow;
    }
  }

  /// Download all pages for [document] using flutter_cache_manager,
  /// then mark it as downloaded in SQLite.
  @override
  Future<void> downloadDocument(DocumentModel document) async {
    if (kIsWeb) return;

    const storage = FlutterSecureStorage();
    final token = await storage.read(key: 'auth_token');
    final deviceId = await storage.read(key: 'device_id');

    final Map<String, String> headers = {};
    if (token != null) headers['Authorization'] = 'Bearer $token';
    if (deviceId != null) headers['X-Device-Id'] = deviceId;

    final pageCount = document.pageCount ?? 0;
    if (pageCount == 0) {
      debugPrint(
        'DocumentRepositoryImpl: No pages to download for doc ${document.id}',
      );
      return;
    }

    for (int i = 1; i <= pageCount; i++) {
      final imageUrl = '${ApiClient.baseUrl}documents/${document.id}/page/$i';
      await DefaultCacheManager().downloadFile(
        imageUrl,
        key: imageUrl,
        authHeaders: headers,
      );
    }

    // Mark in SQLite so the UI can reflect the downloaded status
    await localDataSource.markAsDownloaded(document.id);
  }

  /// Check whether a document's pages are fully cached locally.
  Future<bool> isDocumentDownloaded(int documentId) async {
    if (kIsWeb) return false;
    return localDataSource.isDocumentDownloaded(documentId);
  }

  /// Clear the local SQLite cache (call on logout).
  Future<void> clearLocalCache() async {
    if (kIsWeb) return;
    await localDataSource.clearAll();
  }
}
