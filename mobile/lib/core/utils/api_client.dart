import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  final Dio dio;
  final FlutterSecureStorage storage;
  static const String baseUrl =
      'https://phplaravel-1593166-6235114.cloudwaysapps.com/api';

  ApiClient({required this.dio, required this.storage}) {
    dio.options.baseUrl = baseUrl;
    dio.options.connectTimeout = const Duration(seconds: 30);
    dio.options.receiveTimeout = const Duration(seconds: 30);

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          String? token;
          String? deviceId;

          try {
            token = await storage.read(key: 'auth_token');
            deviceId = await storage.read(key: 'device_id');
          } catch (e) {
            // If storage fails (common on Android Keystore issues), proceed as guest
            print('ApiClient: Secure storage read error: $e');
          }

          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }

          if (deviceId == null) {
            // Generate a permanent device ID if we don't have one
            deviceId =
                "dev_${DateTime.now().millisecondsSinceEpoch}_${(options.path.hashCode % 1000)}";
            try {
              await storage.write(key: 'device_id', value: deviceId);
            } catch (e) {
              print('ApiClient: Secure storage write error: $e');
            }
          }
          options.headers['X-Device-Id'] = deviceId;

          return handler.next(options);
        },
        onResponse: (response, handler) {
          return handler.next(response);
        },
        onError: (DioException e, handler) {
          return handler.next(e);
        },
      ),
    );
  }

  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    return await dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> post(String path, {dynamic data}) async {
    return await dio.post(path, data: data);
  }
}
