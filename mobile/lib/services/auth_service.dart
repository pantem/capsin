import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config.dart';

class AuthService {
  static const String _tokenKey = 'auth_token';
  static const String _userNombreKey = 'auth_user_nombre';
  static const String _userUsernameKey = 'auth_user_username';

  Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey) != null;
  }

  Future<Map<String, String>> login(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'username': username, 'password': password}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final token = data['token'] as String;
        final usuario = data['usuario'] as Map<String, dynamic>;
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_tokenKey, token);
        await prefs.setString(_userNombreKey, usuario['nombre'] as String? ?? '');
        await prefs.setString(
            _userUsernameKey, usuario['username'] as String? ?? '');
        return {'ok': 'true', 'nombre': usuario['nombre'] as String? ?? ''};
      }

      final error = jsonDecode(response.body) as Map<String, dynamic>;
      return {'ok': 'false', 'error': error['error'] as String? ?? 'Error de conexión'};
    } catch (e) {
      return {'ok': 'false', 'error': 'No se pudo conectar con el servidor'};
    }
  }

  Future<String> getUserNombre() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userNombreKey) ?? '';
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userNombreKey);
    await prefs.remove(_userUsernameKey);
  }
}
