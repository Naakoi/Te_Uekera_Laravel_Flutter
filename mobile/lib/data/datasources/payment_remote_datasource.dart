import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:uuid/uuid.dart';
import '/core/utils/api_client.dart';

class PaymentRemoteDataSource {
  final ApiClient apiClient;
  final FlutterSecureStorage secureStorage;

  PaymentRemoteDataSource({
    required this.apiClient,
    required this.secureStorage,
  });

  Future<String> _getDeviceId() async {
    String? deviceId = await secureStorage.read(key: 'device_id');
    if (deviceId == null) {
      deviceId = const Uuid().v4();
      await secureStorage.write(key: 'device_id', value: deviceId);
    }
    return deviceId;
  }

  Future<bool> redeemCode(String code, int? documentId) async {
    try {
      final deviceId = await _getDeviceId();
      final response = await apiClient.dio.post(
        '/redeem-code',
        data: {
          'code': code.toUpperCase(),
          'document_id': documentId,
          'device_id': deviceId,
        },
      );

      if (response.statusCode == 200) {
        return true;
      } else {
        throw Exception(response.data['message'] ?? 'Failed to redeem code');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response!.data['message'] ?? 'Failed to redeem code');
      }
      rethrow;
    }
  }

  Future<String> createStripeCheckoutSession({
    int? planId,
    int? documentId,
  }) async {
    try {
      final response = await apiClient.dio.post(
        '/payments/stripe/checkout',
        data: {'plan_id': ?planId, 'document_id': ?documentId},
      );

      if (response.statusCode == 200) {
        return response.data['url'];
      } else {
        throw Exception(
          response.data['error'] ?? 'Failed to create checkout session',
        );
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(
          e.response!.data['error'] ?? 'Failed to create checkout session',
        );
      }
      rethrow;
    }
  }
}
