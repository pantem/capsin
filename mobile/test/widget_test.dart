import 'package:flutter_test/flutter_test.dart';
import 'package:siniestros_sismo/main.dart';

void main() {
  testWidgets('App loads correctly', (WidgetTester tester) async {
    await tester.pumpWidget(const SiniestrosSismoApp());
    expect(find.text('Siniestros Sismo'), findsOneWidget);
  });
}
