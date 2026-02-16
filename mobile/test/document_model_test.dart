import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/data/models/document_model.dart';

void main() {
  group('DocumentModel', () {
    final tJson = {
      'id': 1,
      'title': 'Test Newspaper',
      'description': 'Description',
      'price': '9.99',
      'published_at': '2024-02-11T00:00:00.000Z',
    };

    test('should return a valid model from JSON', () {
      // act
      final result = DocumentModel.fromJson(tJson);

      // assert
      expect(result.id, 1);
      expect(result.title, 'Test Newspaper');
      expect(result.price, '9.99');
      expect(result.publishedAt, isA<DateTime>());
    });

    test('should return a JSON map containing proper data', () {
      // arrange
      final model = DocumentModel(
        id: 1,
        title: 'Test Newspaper',
        description: 'Description',
        price: '9.99',
        publishedAt: DateTime.parse('2024-02-11T00:00:00.000Z'),
      );

      // act
      final result = model.toJson();

      // assert
      expect(result['id'], 1);
      expect(result['title'], 'Test Newspaper');
      expect(result['price'], '9.99');
    });
  });
}
