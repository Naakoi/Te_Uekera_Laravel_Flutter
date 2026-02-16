import '../../core/utils/api_client.dart';

abstract class AuthRemoteDataSource {
  Future<Map<String, dynamic>> login(String email, String password);
  Future<void> logout();
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final ApiClient apiClient;

  AuthRemoteDataSourceImpl(this.apiClient);

  @override
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await apiClient.post('/login', data: {
      'email': email,
      'password': password,
    });
    
    return response.data;
  }

  @override
  Future<void> logout() async {
    await apiClient.post('/logout');
  }
}
