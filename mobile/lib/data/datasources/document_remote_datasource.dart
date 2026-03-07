import 'package:dio/dio.dart';
import 'package:mobile/core/utils/api_client.dart';
import 'package:mobile/data/models/document_model.dart';

class SessionExpiredException implements Exception {
  final String message;
  SessionExpiredException(this.message);
  @override
  String toString() => message;
}

class DocumentRemoteDataSource {
  final ApiClient apiClient;

  DocumentRemoteDataSource({required this.apiClient});

  Future<List<DocumentModel>> getDocuments() async {
    try {
      final response = await apiClient.dio.get('documents');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data['data'] ?? [];
        return data.map((json) => DocumentModel.fromJson(json)).toList();
      } else {
        throw Exception(
          'Server returned ${response.statusCode}: ${response.statusMessage}',
        );
      }
    } on DioException catch (e) {
      // If server explicitly says session expired, throw a typed exception
      // so the AuthBloc can intercept and force re-login
      if (e.response?.statusCode == 401) {
        final data = e.response?.data;
        if (data is Map && data['requires_reauth'] == true) {
          throw SessionExpiredException(
            data['message'] ?? 'Your session has expired. Please log in again.',
          );
        }
      }
      print('DocumentRemoteDataSource: Error fetching documents: $e');
      rethrow;
    } catch (e) {
      print('DocumentRemoteDataSource: Error fetching documents: $e');
      rethrow;
    }
  }

  Future<DocumentModel> getDocumentById(int id) async {
    try {
      final response = await apiClient.dio.get('documents/$id');
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
