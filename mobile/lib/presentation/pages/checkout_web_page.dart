import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:google_fonts/google_fonts.dart';

class CheckoutWebPage extends StatefulWidget {
  final String initialUrl;
  final String successUrl;
  final VoidCallback onPaymentSuccess;

  const CheckoutWebPage({
    super.key,
    required this.initialUrl,
    required this.successUrl,
    required this.onPaymentSuccess,
  });

  @override
  State<CheckoutWebPage> createState() => _CheckoutWebPageState();
}

class _CheckoutWebPageState extends State<CheckoutWebPage> {
  late final WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (url) {
            setState(() {
              _isLoading = true;
            });
          },
          onPageFinished: (url) {
            setState(() {
              _isLoading = false;
            });
          },
          onNavigationRequest: (request) {
            if (request.url.startsWith(widget.successUrl)) {
              widget.onPaymentSuccess();
              Navigator.pop(context);
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.initialUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'CHECKOUT',
          style: GoogleFonts.inter(fontWeight: FontWeight.w900, fontSize: 16),
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            const Center(
              child: CircularProgressIndicator(color: Color(0xFFbe1e2d)),
            ),
        ],
      ),
    );
  }
}
