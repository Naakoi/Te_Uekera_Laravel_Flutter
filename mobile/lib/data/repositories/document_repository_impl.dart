import '/data/datasources/document_remote_datasource.dart';
import '/data/models/document_model.dart';
import '/domain/repositories/document_repository.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '/core/utils/api_client.dart';
import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';

class DocumentRepositoryImpl implements DocumentRepository {
  final DocumentRemoteDataSource remoteDataSource;

  DocumentRepositoryImpl({required this.remoteDataSource});

  @override
  Future<List<DocumentModel>> getDocuments() async {
    try {
      final documents = await remoteDataSource.getDocuments();
      final directory = await getApplicationDocumentsDirectory();
      final file = File('${directory.path}/cached_documents.json');
      final jsonString = jsonEncode(documents.map((e) => e.toJson()).toList());
      await file.writeAsString(jsonString);
      return documents;
    } catch (e) {
      rethrow;
    }
  }

  @override
  Future<List<DocumentModel>> getCachedDocuments() async {
    try {
      final directory = await getApplicationDocumentsDirectory();
      final file = File('${directory.path}/cached_documents.json');
      if (await file.exists()) {
        final jsonString = await file.readAsString();
        final List<dynamic> jsonList = jsonDecode(jsonString);
        return jsonList.map((e) => DocumentModel.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
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
      await DefaultCacheManager().downloadFile(
        imageUrl,
        key: imageUrl,
        authHeaders: headers,
      );
    }
  }
}
