import 'package:equatable/equatable.dart';

abstract class PaymentEvent extends Equatable {
  const PaymentEvent();

  @override
  List<Object> get props => [];
}

class PaymentRedeemCodeRequested extends PaymentEvent {
  final String code;
  final int? documentId;

  const PaymentRedeemCodeRequested({required this.code, this.documentId});

  @override
  List<Object> get props => [code, documentId ?? ''];
}

class PaymentCheckoutRequested extends PaymentEvent {
  final int? planId;
  final int? documentId;

  const PaymentCheckoutRequested({this.planId, this.documentId});

  @override
  List<Object> get props => [planId ?? '', documentId ?? ''];
}
