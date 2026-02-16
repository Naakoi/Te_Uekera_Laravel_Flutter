import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import '../blocs/auth/auth_bloc.dart';
import '../blocs/auth/auth_event.dart';
import '../blocs/auth/auth_state.dart';
import 'login_page.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Start Here', style: GoogleFonts.inter(fontWeight: FontWeight.w900, fontSize: 14, letterSpacing: 2, color: Colors.black)),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        bottom: PreferredSize(preferredSize: const Size.fromHeight(1), child: Container(color: Colors.black.withAlpha(20), height: 1)),
      ),
      body: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, state) {
          if (state is AuthLoading) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFFbe1e2d)));
          }

          if (state is AuthFailure) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 60, color: Colors.red),
                    const SizedBox(height: 16),
                    Text(
                      'Authentication Error',
                      style: GoogleFonts.inter(fontSize: 20, color: Colors.red, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      state.message,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.grey),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () => context.read<AuthBloc>().add(AuthCheckRequested()),
                      child: const Text('RETRY'),
                    )
                  ],
                ),
              ),
            );
          }

          if (state is AuthAuthenticated) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                   Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        color: Colors.green[100],
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.check_circle, size: 50, color: Colors.green),
                    ),
                    const SizedBox(height: 24),
                  Text(
                    'Welcome Back!',
                    style: GoogleFonts.playfairDisplay(fontSize: 32, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'You are logged in.',
                    style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey),
                  ),
                  const SizedBox(height: 48),
                  ElevatedButton(
                    onPressed: () {
                       context.read<AuthBloc>().add(AuthLogoutRequested());
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFFbe1e2d),
                      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 16),
                       side: const BorderSide(color: Color(0xFFbe1e2d), width: 2),
                    ),
                    child: Text('LOGOUT', style: GoogleFonts.inter(fontWeight: FontWeight.w900, letterSpacing: 1)),
                  )

                ],
              ),
            );
          }
          
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(40.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.lock_person, size: 80, color: Colors.grey),
                  const SizedBox(height: 24),
                   Text(
                    'Guest Access',
                    style: GoogleFonts.playfairDisplay(fontSize: 32, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                   Text(
                    'Log in to view your purchased newspapers and manage your subscription.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.sourceSerif4(fontSize: 16, color: Colors.grey[700]),
                  ),
                  const SizedBox(height: 48),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (context) => const LoginPage()),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFbe1e2d),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 18),
                      elevation: 8,
                      shadowColor: const Color(0xFFbe1e2d).withAlpha(100),
                    ),
                    child: Text('LOGIN TO ACCOUNT', style: GoogleFonts.inter(fontWeight: FontWeight.w900, letterSpacing: 2)),
                  ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
