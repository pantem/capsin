import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'services/auth_service.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const SiniestrosSismoApp());
}

class SiniestrosSismoApp extends StatefulWidget {
  const SiniestrosSismoApp({super.key});

  @override
  State<SiniestrosSismoApp> createState() => _SiniestrosSismoAppState();
}

class _SiniestrosSismoAppState extends State<SiniestrosSismoApp> {
  final _auth = AuthService();
  bool _cargando = true;
  bool _logueado = false;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final loggedIn = await _auth.isLoggedIn();
    if (!mounted) return;
    setState(() {
      _logueado = loggedIn;
      _cargando = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Siniestros Sismo',
      debugShowCheckedModeBanner: false,
      locale: const Locale('es', 'MX'),
      supportedLocales: const [
        Locale('es', 'MX'),
        Locale('en', 'US'),
      ],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: const ColorScheme(
          brightness: Brightness.light,
          primary: Color(0xFF7A0C38),
          onPrimary: Color(0xFFFFFFFF),
          primaryContainer: Color(0xFFFFD9E2),
          onPrimaryContainer: Color(0xFF3E001D),
          secondary: Color(0xFFbc955c),
          onSecondary: Color(0xFFFFFFFF),
          secondaryContainer: Color(0xFFFFF0DA),
          onSecondaryContainer: Color(0xFF3E2B10),
          tertiary: Color(0xFF7A5800),
          onTertiary: Color(0xFFFFFFFF),
          error: Color(0xFFBA1A1A),
          onError: Color(0xFFFFFFFF),
          surface: Color(0xFFFCFCFC),
          onSurface: Color(0xFF1C1B1E),
          surfaceVariant: Color(0xFFF0F2F5),
          onSurfaceVariant: Color(0xFF718096),
          outline: Color(0xFFD1D5DB),
          outlineVariant: Color(0xFFC4C6D0),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF7A0C38),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        cardTheme: const CardThemeData(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(12)),
            side: BorderSide(color: Color(0xFFEEF0F3)),
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            backgroundColor: const Color(0xFF7A0C38),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFF7A0C38),
            side: const BorderSide(color: Color(0xFF7A0C38)),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
        inputDecorationTheme: const InputDecorationTheme(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.all(Radius.circular(8)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.all(Radius.circular(8)),
            borderSide: BorderSide(color: Color(0xFF7A0C38), width: 2),
          ),
          filled: true,
          fillColor: Color(0xFFF9FAFB),
        ),
        tabBarTheme: const TabBarThemeData(
          labelColor: Colors.white,
          unselectedLabelColor: Color(0xB3FFFFFF),
          indicatorColor: Color(0xFFbc955c),
          indicatorSize: TabBarIndicatorSize.tab,
        ),
        dividerTheme: const DividerThemeData(
          color: Color(0xFFEDF2F7),
          thickness: 1,
        ),
      ),
      home: _cargando
          ? const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            )
          : _logueado
              ? const HomeScreen()
              : const LoginScreen(),
    );
  }
}
