import '/data/datasources/document_remote_datasource.dart';
import '/data/models/document_model.dart';
import '/domain/repositories/document_repository.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '/core/utils/api_client.dart';

class DocumentRepositoryImpl implements DocumentRepository {
  final DocumentRemoteDataSource remoteDataSource;

  DocumentRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<DocumentModel>> getDocuments() {
    return remoteDataSource.getDocuments();
  }

  @override
  Future<DocumentModel> getDocumentById(int id) {
    return remoteDataSource.getDocumentById(id);
  }
  @override
  Future<void> downloadDocument(DocumentModel document) async {
    const storage = FlutterSecureStorage();
    final token = await storage.read(key: 'auth_token');
    final deviceId = await storage.read(key: 'device_id');
    
    final Map<String, String> headers = {};
    if (token != null) headers['Authorization'] = 'Bearer $token';
    if (deviceId != null) headers['X-Device-Id'] = deviceId;

    final pageCount = document.pageCount ?? 0;
    if (pageCount == 0) return;

    for (int i = 1; i <= pageCount; i++) {
        final imageUrl = '${ApiClient.baseUrl}/documents/${document.id}/pages/$i';
        await DefaultCacheManager().downloadFile(imageUrl, key: imageUrl, authHeaders: headers);
    }
  }
}
