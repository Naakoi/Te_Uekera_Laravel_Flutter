import 'package:flutter_bloc/flutter_bloc.dart';
import '/domain/repositories/payment_repository.dart';
import 'payment_event.dart';
import 'payment_state.dart';

class PaymentBloc extends Bloc<PaymentEvent, PaymentState> {
  final PaymentRepository paymentRepository;

  PaymentBloc({required this.paymentRepository}) : super(PaymentInitial()) {
    on<PaymentRedeemCodeRequested>(_onPaymentRedeemCodeRequested);
    on<PaymentCheckoutRequested>(_onPaymentCheckoutRequested);
  }

  Future<void> _onPaymentRedeemCodeRequested(
    PaymentRedeemCodeRequested event,
    Emitter<PaymentState> emit,
  ) async {
    emit(PaymentLoading());
    try {
      final success = await paymentRepository.redeemCode(event.code, event.documentId);
      if (success) {
        emit(const PaymentSuccess(message: 'Code successfully redeemed!'));
      } else {
        emit(const PaymentFailure(message: 'Failed to redeem code'));
      }
    } catch (e) {
      emit(PaymentFailure(message: e.toString()));
    }
  }

  Future<void> _onPaymentCheckoutRequested(
    PaymentCheckoutRequested event,
    Emitter<PaymentState> emit,
  ) async {
    emit(PaymentLoading());
    try {
      final url = await paymentRepository.createStripeCheckoutSession(
        planId: event.planId,
        documentId: event.documentId,
      );
      emit(PaymentCheckoutSessionReady(checkoutUrl: url));
    } catch (e) {
      emit(PaymentFailure(message: e.toString()));
    }
  }
}
