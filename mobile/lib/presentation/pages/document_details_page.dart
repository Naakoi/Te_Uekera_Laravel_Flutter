import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import '/data/models/document_model.dart';
import '/presentation/blocs/payment/payment_bloc.dart';
import '/presentation/blocs/payment/payment_event.dart';
import '/presentation/blocs/payment/payment_state.dart';
import '/presentation/blocs/document_bloc.dart';
import '/presentation/blocs/document_event.dart';
import '/presentation/blocs/document_state.dart';
import '/presentation/blocs/auth/auth_bloc.dart';
import '/presentation/blocs/auth/auth_state.dart';
import 'document_viewer_page.dart';
import 'checkout_web_page.dart';
import 'login_page.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter/foundation.dart';

class DocumentDetailsPage extends StatefulWidget {
  final DocumentModel document;

  const DocumentDetailsPage({super.key, required this.document});

  @override
  State<DocumentDetailsPage> createState() => _DocumentDetailsPageState();
}

class _DocumentDetailsPageState extends State<DocumentDetailsPage> {
  final TextEditingController _codeController = TextEditingController();

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  void _submitRedeemCode() {
    if (!_checkAuthAndPrompt()) return;

    if (_codeController.text.isNotEmpty) {
      context.read<PaymentBloc>().add(
        PaymentRedeemCodeRequested(
          code: _codeController.text,
          documentId: widget.document.id,
        ),
      );
    }
  }

  void _showRedeemDialog() {
    if (!_checkAuthAndPrompt()) return;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        scrollable: true, // Make dialog scrollable
        backgroundColor: const Color(0xFFf4f1ea),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: Color(0xFFbe1e2d), width: 2),
        ),
        title: Text(
          'UNLOCK EDITION',
          style: GoogleFonts.inter(
            fontWeight: FontWeight.w900,
            color: const Color(0xFFbe1e2d),
            fontSize: 18,
          ), // Reduced font size
          textAlign: TextAlign.center,
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Enter your single-use code.',
              style: GoogleFonts.sourceSerif4(
                fontStyle: FontStyle.italic,
                color: Colors.grey[700],
                fontSize: 14,
              ), // Reduced font size
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12), // Reduced spacing
            TextField(
              controller: _codeController,
              decoration: InputDecoration(
                filled: true,
                fillColor: Colors.white,
                hintText: 'ENTER CODE...',
                hintStyle: GoogleFonts.inter(
                  fontWeight: FontWeight.w900,
                  color: Colors.grey[400],
                  letterSpacing: 2.0,
                  fontSize: 14,
                ), // Reduced font size
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(
                  vertical: 12,
                  horizontal: 16,
                ), // Reduced padding
              ),
              style: GoogleFonts.inter(
                fontWeight: FontWeight.w900,
                letterSpacing: 2.0,
                fontSize: 16,
              ), // Reduced font size
              textAlign: TextAlign.center,
              textCapitalization: TextCapitalization.characters,
              textInputAction:
                  TextInputAction.done, // Allow submitting from keyboard
              onSubmitted: (_) => _submitRedeemCode(), // Submit on enter
            ),
          ],
        ),
        actionsPadding: const EdgeInsets.fromLTRB(
          16,
          0,
          16,
          16,
        ), // Reduced padding
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'CANCEL',
              style: GoogleFonts.inter(
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
          ),
          BlocConsumer<PaymentBloc, PaymentState>(
            listener: (context, state) {
              if (state is PaymentSuccess) {
                Navigator.pop(context); // Close dialog
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(state.message),
                    backgroundColor: Colors.green,
                  ),
                );
                context.read<DocumentBloc>().add(
                  FetchDocuments(),
                ); // Refresh list to update status
                Navigator.pop(
                  context,
                ); // Go back to list (or refresh current page if we want to stay)
              } else if (state is PaymentFailure) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(state.message),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            },
            builder: (context, state) {
              if (state is PaymentLoading) {
                return const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    color: Color(0xFFbe1e2d),
                    strokeWidth: 2,
                  ),
                );
              }
              return ElevatedButton(
                onPressed: _submitRedeemCode,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFbe1e2d),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 12,
                  ), // Reduced padding
                ),
                child: Text(
                  'UNLOCK NOW',
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                  ),
                ), // Reduced size
              );
            },
          ),
        ],
      ),
    );
  }

  void _handleStripeCheckout(String url) async {
    if (kIsWeb) {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      }
    } else {
      // For Mobile, use WebView
      if (!mounted) return;
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => CheckoutWebPage(
            initialUrl: url,
            successUrl:
                'https://phplaravel-1593166-6235114.cloudwaysapps.com/api/payments/stripe/success',
            onPaymentSuccess: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Payment Successful!'),
                  backgroundColor: Colors.green,
                ),
              );
              context.read<DocumentBloc>().add(FetchDocuments());
            },
          ),
        ),
      );
    }
  }

  bool _checkAuthAndPrompt() {
    final authState = context.read<AuthBloc>().state;
    if (authState is! AuthAuthenticated) {
      _showAuthPromptDialog();
      return false;
    }
    return true;
  }

  void _showAuthPromptDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFFf4f1ea),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: Color(0xFFbe1e2d), width: 2),
        ),
        title: Text(
          'SIGN IN REQUIRED',
          style: GoogleFonts.inter(
            fontWeight: FontWeight.w900,
            color: const Color(0xFFbe1e2d),
            fontSize: 18,
          ),
          textAlign: TextAlign.center,
        ),
        content: Text(
          'Please log in or sign up to purchase or redeem editions. Your purchases will be synced across all your devices.',
          style: GoogleFonts.sourceSerif4(
            fontSize: 14,
            color: Colors.grey[800],
          ),
          textAlign: TextAlign.center,
        ),
        actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'CANCEL',
              style: GoogleFonts.inter(
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const LoginPage()),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFbe1e2d),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            ),
            child: Text(
              'LOGIN NOW',
              style: GoogleFonts.inter(
                fontWeight: FontWeight.w900,
                fontSize: 14,
              ),
            ),
          ),
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: () async {
              Navigator.pop(context);
              const url =
                  'https://phplaravel-1593166-6235114.cloudwaysapps.com/register';
              final uri = Uri.parse(url);
              if (await canLaunchUrl(uri)) {
                await launchUrl(uri);
              }
            },
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFFbe1e2d)),
              foregroundColor: const Color(0xFFbe1e2d),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            ),
            child: Text(
              'SIGN UP',
              style: GoogleFonts.inter(
                fontWeight: FontWeight.w900,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailsContent(
    BuildContext context, {
    required DocumentModel document,
    required bool scrollable,
  }) {
    // Use 'document' instead of 'widget.document' in this method
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: const Color(0xFFffde00),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            'OFFICIAL EDITION',
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              letterSpacing: 1.5,
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Title
        Text(
          document.title.toUpperCase(),
          style: GoogleFonts.playfairDisplay(
            fontSize: 36,
            fontWeight: FontWeight.w900,
            height: 1.1,
            color: const Color(0xFF1a1a1a),
          ),
        ),
        const SizedBox(height: 20),

        // Description
        Container(
          decoration: const BoxDecoration(
            border: Border(
              left: BorderSide(color: Color(0xFFbe1e2d), width: 3),
            ),
          ),
          padding: const EdgeInsets.only(left: 16),
          child: Text(
            document.description ??
                'Access this high-fidelity digital edition of our newsletter.',
            style: GoogleFonts.sourceSerif4(
              fontSize: 16,
              height: 1.5,
              fontStyle: FontStyle.italic,
              color: Colors.grey[800],
            ),
          ),
        ),
        const SizedBox(height: 32),

        // Actions
        if (document.hasAccess) ...[
          ElevatedButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => DocumentViewerPage(document: document),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1a1a1a),
              foregroundColor: const Color(0xFFffde00),
              padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 24),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: Text(
              'OPEN DOCUMENT READER',
              style: GoogleFonts.inter(
                fontWeight: FontWeight.w900,
                letterSpacing: 1.2,
                fontSize: 14,
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Download Button
          BlocConsumer<DocumentBloc, DocumentState>(
            listener: (context, state) {
              if (state is DocumentDownloadSuccess) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(state.message),
                    backgroundColor: Colors.green,
                  ),
                );
              } else if (state is DocumentError) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(state.message),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            },
            builder: (context, state) {
              if (state is DocumentDownloading) {
                return const Center(
                  child: CircularProgressIndicator(color: Color(0xFFbe1e2d)),
                );
              }
              return OutlinedButton.icon(
                onPressed: () {
                  context.read<DocumentBloc>().add(
                    DownloadDocumentRequested(document),
                  );
                },
                icon: const Icon(Icons.download, size: 18),
                label: Text(
                  'SAVE FOR OFFLINE',
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.w900,
                    letterSpacing: 1.2,
                    fontSize: 14,
                  ),
                ),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFFbe1e2d),
                  side: const BorderSide(color: Color(0xFFbe1e2d)),
                  padding: const EdgeInsets.symmetric(
                    vertical: 16,
                    horizontal: 24,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              );
            },
          ),
        ] else ...[
          BlocBuilder<AuthBloc, AuthState>(
            builder: (context, authState) {
              final bool isAuthenticated = authState is AuthAuthenticated;
              return Column(
                children: [
                  Row(
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'SINGLE EDITION PRICE',
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              color: Colors.grey,
                            ),
                          ),
                          Text(
                            '\$${document.price}',
                            style: GoogleFonts.inter(
                              fontSize: 32,
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFFbe1e2d),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(width: 24),
                      Expanded(
                        child: BlocBuilder<PaymentBloc, PaymentState>(
                          builder: (context, state) {
                            if (state is PaymentLoading) {
                              return const Center(
                                child: CircularProgressIndicator(
                                  color: Color(0xFFbe1e2d),
                                ),
                              );
                            }
                            return ElevatedButton(
                              onPressed: () {
                                if (_checkAuthAndPrompt()) {
                                  context.read<PaymentBloc>().add(
                                    PaymentCheckoutRequested(
                                      documentId: document.id,
                                    ),
                                  );
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFbe1e2d),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  vertical: 20,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              child: Text(
                                isAuthenticated
                                    ? 'PAY ONLINE'
                                    : 'LOGIN TO PURCHASE',
                                style: GoogleFonts.inter(
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1.2,
                                  fontSize: 13,
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      const Expanded(child: Divider()),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        child: Text(
                          'OR USE ACTIVATION CODE',
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            fontStyle: FontStyle.italic,
                            color: Colors.grey,
                          ),
                        ),
                      ),
                      const Expanded(child: Divider()),
                    ],
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: _showRedeemDialog,
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 20),
                        side: BorderSide(
                          color: isAuthenticated
                              ? const Color(0xFFbe1e2d)
                              : Colors.grey,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        foregroundColor: const Color(0xFFbe1e2d),
                      ),
                      child: Text(
                        isAuthenticated
                            ? 'REDEEM ACTIVATION CODE'
                            : 'LOGIN TO REDEEM',
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.2,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFf4f1ea),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          if (constraints.maxWidth > 800) {
            // Desktop/Tablet Layout (and Mobile Landscape)
            final bool isShortScreen = constraints.maxHeight < 600;
            final double imageHeight = isShortScreen ? 250 : 450;

            return Center(
              child: SingleChildScrollView(
                padding: EdgeInsets.symmetric(
                  vertical: isShortScreen ? 16 : 48,
                ),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(
                    maxWidth: 1000,
                  ), // Reduced max width
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32.0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Left Column: Image
                        Expanded(
                          flex: 4, // Adjusted flex
                          child: Container(
                            height: imageHeight, // Dynamic height
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(
                                20,
                              ), // Tighter radius
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.1),
                                  blurRadius: 20,
                                  offset: const Offset(0, 10),
                                ),
                              ],
                            ),
                            clipBehavior: Clip.antiAlias,
                            child: widget.document.thumbnailPath != null
                                ? Image.network(
                                    'https://phplaravel-1593166-6235114.cloudwaysapps.com/api/images/${widget.document.thumbnailPath}',
                                    fit: BoxFit.cover,
                                    errorBuilder:
                                        (context, error, stackTrace) =>
                                            const Center(
                                              child: Icon(
                                                Icons.newspaper,
                                                size: 48,
                                                color: Colors.grey,
                                              ),
                                            ),
                                  )
                                : const Center(
                                    child: Icon(
                                      Icons.newspaper,
                                      size: 48,
                                      color: Colors.grey,
                                    ),
                                  ),
                          ),
                        ),
                        const SizedBox(width: 32), // Reduced gap
                        // Right Column: Details
                        Expanded(
                          flex: 5, // Adjusted flex
                          child: SizedBox(
                            // Ensure height matches image or grows, but allows inner scrolling if needed
                            // Actually, simple Column is better here since we are in a SingleChildScrollView now.
                            // But we want the right side to be at least as tall as the image?
                            // Or just let it flow. The outer ScrollView handles the main scroll.
                            // The inner ScrollView on the right is redundant if we scroll the whole page.
                            height: isShortScreen
                                ? null
                                : 450, // Fixed height on tall screens to allow inner scroll, or null on short screens to flow?
                            // Let's rely on the outer scroll for short screens.
                            // But for tall screens, we liked the fixed image and scrollable text.
                            // Hybrid approach:
                            // If isShortScreen, let content flow normally (outer scroll).
                            // If tall screen, keep the fixed height look?
                            // Let's try making height: imageHeight for consistent alignment, relying on inner scroll.
                            child: isShortScreen
                                ? _buildDetailsContent(
                                    context,
                                    document: widget.document,
                                    scrollable: false,
                                  ) // No inner scroll, use outer
                                : SizedBox(
                                    height: imageHeight,
                                    child: SingleChildScrollView(
                                      child: _buildDetailsContent(
                                        context,
                                        document: widget.document,
                                        scrollable: false,
                                      ),
                                    ),
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          } else {
            // Mobile Layout (Original)
            return SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Hero Image Section
                    Container(
                      height: 400,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(30),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: widget.document.thumbnailPath != null
                          ? Image.network(
                              'https://phplaravel-1593166-6235114.cloudwaysapps.com/api/images/${widget.document.thumbnailPath}',
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) =>
                                  const Center(
                                    child: Icon(
                                      Icons.newspaper,
                                      size: 64,
                                      color: Colors.grey,
                                    ),
                                  ),
                            )
                          : const Center(
                              child: Icon(
                                Icons.newspaper,
                                size: 64,
                                color: Colors.grey,
                              ),
                            ),
                    ),
                    const SizedBox(height: 32),

                    // Wrap content in BlocListener for Payment checkout redirects
                    BlocListener<PaymentBloc, PaymentState>(
                      listener: (context, state) {
                        if (state is PaymentCheckoutSessionReady) {
                          _handleStripeCheckout(state.checkoutUrl);
                        } else if (state is PaymentFailure) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(state.message),
                              backgroundColor: Colors.red,
                            ),
                          );
                        }
                      },
                      child: BlocBuilder<DocumentBloc, DocumentState>(
                        builder: (context, state) {
                          DocumentModel currentDoc = widget.document;
                          if (state is DocumentLoaded) {
                            // Try to find the updated document
                            try {
                              currentDoc = state.documents.firstWhere(
                                (d) => d.id == widget.document.id,
                              );
                            } catch (_) {}
                          }

                          return _buildDetailsContent(
                            context,
                            document: currentDoc,
                            scrollable: false,
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            );
          }
        },
      ),
    );
  }
}
