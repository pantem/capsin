import 'package:flutter_test/flutter_test.dart';
import 'package:beta/main.dart';

void main() {
  testWidgets('App renders home screen', (WidgetTester tester) async {
    await tester.pumpWidget(const BetaApp());
    expect(find.text('Beta - Siniestros'), findsOneWidget);
  });
}
