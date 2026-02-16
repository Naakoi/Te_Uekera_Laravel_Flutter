import 'package:equatable/equatable.dart';

abstract class PaymentState extends Equatable {
  const PaymentState();
  
  @override
  List<Object> get props => [];
}

class PaymentInitial extends PaymentState {}

class PaymentLoading extends PaymentState {}

class PaymentSuccess extends PaymentState {
  final String message;
  const PaymentSuccess({required this.message});
}

class PaymentFailure extends PaymentState {
  final String message;
  const PaymentFailure({required this.message});
  
  @override
  List<Object> get props => [message];
}

class PaymentCheckoutSessionReady extends PaymentState {
  final String checkoutUrl;
  const PaymentCheckoutSessionReady({required this.checkoutUrl});

  @override
  List<Object> get props => [checkoutUrl];
}
