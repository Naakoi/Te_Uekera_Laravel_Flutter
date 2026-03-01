void main() {
  try {
    print(Uri.parse('http://example.com?token=1|abcd'));
  } catch (e) {
    print('Error: $e');
  }
}
