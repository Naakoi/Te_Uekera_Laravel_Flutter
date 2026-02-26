import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object> get props => [];
}

class AuthCheckRequested extends AuthEvent {}

class AuthLoginRequested extends AuthEvent {
  final String email;
  final String password;
  final bool logoutOthers;

  const AuthLoginRequested({
    required this.email,
    required this.password,
    this.logoutOthers = false,
  });

  @override
  List<Object> get props => [email, password, logoutOthers];
}

class AuthLogoutRequested extends AuthEvent {}

class AuthLogoutOthersRequested extends AuthEvent {}
