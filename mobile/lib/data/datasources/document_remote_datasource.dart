import '/core/utils/api_client.dart';
import '/data/models/document_model.dart';

class DocumentRemoteDataSource {
  final ApiClient apiClient;

  DocumentRemoteDataSource({required this.apiClient});

  Future<List<DocumentModel>> getDocuments() async {
    try {
      final response = await apiClient.dio.get('/documents');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? [];
        return data.map((json) => DocumentModel.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load documents');
      }
    } catch (e) {
      rethrow;
    }
  }

  Future<DocumentModel> getDocumentById(int id) async {
    try {
      final response = await apiClient.dio.get('/documents/$id');
      if (response.statusCode == 200) {
        return DocumentModel.fromJson(response.data['data']);
      } else {
        throw Exception('Failed to load document');
      }
    } catch (e) {
      rethrow;
    }
  }
}
