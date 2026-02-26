import 'package:equatable/equatable.dart';

abstract class AuthState extends Equatable {
  const AuthState();

  @override
  List<Object> get props => [];
}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

class AuthAuthenticated extends AuthState {}

class AuthUnauthenticated extends AuthState {}

class AuthFailure extends AuthState {
  final String message;

  const AuthFailure(this.message);

  @override
  List<Object> get props => [message];
}

class AuthMultiDeviceFailure extends AuthFailure {
  final String email;
  final String password;

  const AuthMultiDeviceFailure(
    String message, {
    required this.email,
    required this.password,
  }) : super(message);

  @override
  List<Object> get props => [message, email, password];
}
