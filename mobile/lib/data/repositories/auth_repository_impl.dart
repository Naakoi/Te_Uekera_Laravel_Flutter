import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../data/datasources/auth_remote_datasource.dart';
import '../../domain/repositories/auth_repository.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final FlutterSecureStorage storage;

  AuthRepositoryImpl({required this.remoteDataSource, required this.storage});

  @override
  Future<void> login(
    String email,
    String password, {
    bool logoutOthers = false,
  }) async {
    final response = await remoteDataSource.login(
      email,
      password,
      logoutOthers: logoutOthers,
    );
    final token = response['token'];
    // We could also cache the user here

    await storage.write(key: 'auth_token', value: token);
  }

  @override
  Future<void> logout() async {
    try {
      await remoteDataSource.logout();
    } catch (_) {
      // Ignore network errors on logout
    }
    await storage.delete(key: 'auth_token');
  }

  @override
  Future<void> logoutOthers() async {
    await remoteDataSource.logoutOthers();
  }

  @override
  Future<bool> isAuthenticated() async {
    final token = await storage.read(key: 'auth_token');
    return token != null;
  }

  @override
  Future<String?> getToken() async {
    return await storage.read(key: 'auth_token');
  }
}
