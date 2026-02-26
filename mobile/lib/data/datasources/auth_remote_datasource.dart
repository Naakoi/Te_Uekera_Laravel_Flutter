import 'package:dio/dio.dart';
import '../../core/utils/api_client.dart';

abstract class AuthRemoteDataSource {
  Future<Map<String, dynamic>> login(
    String email,
    String password, {
    bool logoutOthers = false,
  });
  Future<void> logout();
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiClient apiClient;

  AuthRemoteDataSourceImpl(this.apiClient);

  @override
  Future<Map<String, dynamic>> login(
    String email,
    String password, {
    bool logoutOthers = false,
  }) async {
    try {
      final response = await apiClient.post(
        '/login',
        data: {
          'email': email,
          'password': password,
          'logout_others': logoutOthers,
        },
      );
      return response.data;
    } catch (e) {
      if (e is DioException && e.response != null && e.response?.data != null) {
        final Map<String, dynamic> data = e.response?.data;
        if (data['requires_logout_others'] == true) {
          throw Exception('MULTI_DEVICE_LOGOUT_REQUIRED');
        }
        if (data.containsKey('message')) {
          throw Exception(data['message']);
        }
      }
      throw Exception('Failed to connect to the server. Please try again.');
    }
  }

  @override
  Future<void> logout() async {
    await apiClient.post('/logout');
  }
}
