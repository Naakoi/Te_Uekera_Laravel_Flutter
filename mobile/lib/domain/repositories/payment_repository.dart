abstract class PaymentRepository {
  Future<bool> redeemCode(String code, int? documentId);
  Future<String> createStripeCheckoutSession({int? planId, int? documentId});
}
