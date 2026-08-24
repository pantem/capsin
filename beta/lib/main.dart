import 'package:flutter/material.dart';
import 'screens/home_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const BetaApp());
}

class BetaApp extends StatelessWidget {
  const BetaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Beta - Siniestros',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.light,
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
      ),
      home: const HomeScreen(),
    );
  }
}
