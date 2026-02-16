import '/domain/repositories/payment_repository.dart';
import '/data/datasources/payment_remote_datasource.dart';

class PaymentRepositoryImpl implements PaymentRepository {
  final PaymentRemoteDataSource remoteDataSource;

  PaymentRepositoryImpl({required this.remoteDataSource});

  @override
  Future<bool> redeemCode(String code, int? documentId) async {
    return await remoteDataSource.redeemCode(code, documentId);
  }

  @override
  Future<String> createStripeCheckoutSession({int? planId, int? documentId}) async {
    return await remoteDataSource.createStripeCheckoutSession(planId: planId, documentId: documentId);
  }
}
