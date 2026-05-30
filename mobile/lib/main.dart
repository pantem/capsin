import 'package:flutter/material.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const SiniestrosSismoApp());
}

class SiniestrosSismoApp extends StatelessWidget {
  const SiniestrosSismoApp({super.key});

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
      home: const HomeScreen(),
    );
  }
}
