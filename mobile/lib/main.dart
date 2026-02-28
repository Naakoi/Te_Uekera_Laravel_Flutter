import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dio/dio.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '/core/utils/api_client.dart';
import '/data/datasources/document_remote_datasource.dart';
import '/data/repositories/document_repository_impl.dart';
import '/presentation/blocs/document_bloc.dart';
import '/presentation/blocs/document_event.dart';

import '/data/datasources/auth_remote_datasource.dart';
import '/data/repositories/auth_repository_impl.dart';
import '/presentation/blocs/auth/auth_bloc.dart';
import '/presentation/blocs/auth/auth_event.dart';

import '/presentation/pages/main_scaffold.dart';
import '/data/datasources/payment_remote_datasource.dart';
import '/data/repositories/payment_repository_impl.dart';
import '/presentation/blocs/payment/payment_bloc.dart';
import 'package:screen_protector/screen_protector.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Apply Global Screen Protection
  await ScreenProtector.preventScreenshotOn();
  await ScreenProtector.protectDataLeakageWithColor(Colors.black);

  final dio = Dio();
  const storage = FlutterSecureStorage();
  final apiClient = ApiClient(dio: dio, storage: storage);

  final documentRemoteDataSource = DocumentRemoteDataSource(
    apiClient: apiClient,
  );
  final documentRepository = DocumentRepositoryImpl(
    remoteDataSource: documentRemoteDataSource,
  );

  final authRemoteDataSource = AuthRemoteDataSourceImpl(apiClient);
  final authRepository = AuthRepositoryImpl(
    remoteDataSource: authRemoteDataSource,
    storage: storage,
  );

  final paymentRemoteDataSource = PaymentRemoteDataSource(
    apiClient: apiClient,
    secureStorage: storage,
  );
  final paymentRepository = PaymentRepositoryImpl(
    remoteDataSource: paymentRemoteDataSource,
  );

  runApp(
    MyApp(
      documentRepository: documentRepository,
      authRepository: authRepository,
      paymentRepository: paymentRepository,
    ),
  );
}

class MyApp extends StatelessWidget {
  final DocumentRepositoryImpl documentRepository;
  final AuthRepositoryImpl authRepository;
  final PaymentRepositoryImpl paymentRepository;

  const MyApp({
    super.key,
    required this.documentRepository,
    required this.authRepository,
    required this.paymentRepository,
  });

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(
          create: (context) =>
              DocumentBloc(repository: documentRepository)
                ..add(FetchDocuments()),
        ),
        BlocProvider(
          create: (context) =>
              AuthBloc(authRepository: authRepository)
                ..add(AuthCheckRequested()),
        ),
        BlocProvider(
          create: (context) =>
              PaymentBloc(paymentRepository: paymentRepository),
        ),
      ],
      child: MaterialApp(
        title: 'Te Uekera',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFFbe1e2d),
            primary: const Color(0xFFbe1e2d),
            surface: const Color(0xFFf4f1ea),
          ),
          scaffoldBackgroundColor: const Color(0xFFf4f1ea),
          textTheme:
              GoogleFonts.sourceSerif4TextTheme(
                Theme.of(context).textTheme,
              ).copyWith(
                displayLarge: GoogleFonts.playfairDisplay(
                  fontWeight: FontWeight.w900,
                ),
                displayMedium: GoogleFonts.playfairDisplay(
                  fontWeight: FontWeight.w900,
                ),
                displaySmall: GoogleFonts.playfairDisplay(
                  fontWeight: FontWeight.w900,
                ),
                headlineLarge: GoogleFonts.inter(fontWeight: FontWeight.w700),
                headlineMedium: GoogleFonts.inter(fontWeight: FontWeight.w700),
                headlineSmall: GoogleFonts.inter(fontWeight: FontWeight.w700),
              ),
        ),
        home: const MainScaffold(),
      ),
    );
  }
}
