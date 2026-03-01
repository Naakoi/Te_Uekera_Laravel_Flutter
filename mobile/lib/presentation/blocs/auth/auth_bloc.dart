import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../domain/repositories/auth_repository.dart';
import 'auth_event.dart';
import 'auth_state.dart';

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthRepository authRepository;

  AuthBloc({required this.authRepository}) : super(AuthInitial()) {
    on<AuthCheckRequested>(_onAuthCheckRequested);
    on<AuthLoginRequested>(_onAuthLoginRequested);
    on<AuthLogoutRequested>(_onAuthLogoutRequested);
    on<AuthLogoutOthersRequested>(_onAuthLogoutOthersRequested);
  }

  Future<void> _onAuthCheckRequested(
    AuthCheckRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      final isAuthenticated = await authRepository.isAuthenticated();
      if (isAuthenticated) {
        final userName = await authRepository.getUserName();
        emit(AuthAuthenticated(userName: userName));
      } else {
        emit(AuthUnauthenticated());
      }
    } catch (e) {
      emit(AuthFailure(e.toString()));
    }
  }

  Future<void> _onAuthLoginRequested(
    AuthLoginRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      await authRepository.login(
        event.email,
        event.password,
        logoutOthers: event.logoutOthers,
      );
      final userName = await authRepository.getUserName();
      emit(AuthAuthenticated(userName: userName));
    } catch (e) {
      final message = e.toString().replaceFirst('Exception: ', '');
      if (message == 'MULTI_DEVICE_LOGOUT_REQUIRED') {
        emit(
          AuthMultiDeviceFailure(
            'Your account is already logged in on another device.',
            email: event.email,
            password: event.password,
          ),
        );
      } else {
        emit(AuthFailure(message));
      }
    }
  }

  Future<void> _onAuthLogoutRequested(
    AuthLogoutRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    await authRepository.logout();
    emit(AuthUnauthenticated());
  }

  Future<void> _onAuthLogoutOthersRequested(
    AuthLogoutOthersRequested event,
    Emitter<AuthState> emit,
  ) async {
    emit(AuthLoading());
    try {
      await authRepository.logoutOthers();
      // Since current session is still valid, we stay Authenticated
      final userName = await authRepository.getUserName();
      emit(AuthAuthenticated(userName: userName));
    } catch (e) {
      emit(AuthFailure(e.toString()));
    }
  }
}
