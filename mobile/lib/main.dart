import 'package:flutter/material.dart';
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
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFF1A237E),
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF1A237E),
          foregroundColor: Colors.white,
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
