abstract class AuthRepository {
  Future<void> login(
    String email,
    String password, {
    bool logoutOthers = false,
  });
  Future<void> logout();
  Future<bool> isAuthenticated();
  Future<String?> getToken();
}
