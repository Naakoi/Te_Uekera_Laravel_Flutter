import 'package:flutter/material.dart';
import 'package:photo_view/photo_view.dart';
import 'package:photo_view/photo_view_gallery.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';
import '/data/models/document_model.dart';
import '/core/utils/api_client.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:screen_protector/screen_protector.dart';

class DocumentViewerPage extends StatefulWidget {
  final DocumentModel document;

  const DocumentViewerPage({super.key, required this.document});

  @override
  State<DocumentViewerPage> createState() => _DocumentViewerPageState();
}

class _DocumentViewerPageState extends State<DocumentViewerPage> {
  late PageController _pageController;
  int _currentPage = 1;
  bool _showControls = true;
  late PhotoViewScaleStateController _scaleStateController;
  String? _authToken;
  String? _deviceId;
  Map<String, String> _headers = {};
  bool _isLoadingParams = true;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _scaleStateController = PhotoViewScaleStateController();
    _loadAuthParams();
    _enableScreenProtection();
  }

  Future<void> _enableScreenProtection() async {
    await ScreenProtector.preventScreenshotOn();
    // Protect against snapshots/app switcher preview
    await ScreenProtector.protectDataLeakageWithColor(Colors.black);
  }

  Future<void> _disableScreenProtection() async {
    await ScreenProtector.preventScreenshotOff();
    await ScreenProtector.protectDataLeakageOff();
  }

  Future<void> _loadAuthParams() async {
    const storage = FlutterSecureStorage();
    final token = await storage.read(key: 'auth_token');
    final deviceId = await storage.read(key: 'device_id');

    final Map<String, String> headers = {};
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    if (deviceId != null) {
      headers['X-Device-Id'] = deviceId;
    }

    setState(() {
      _authToken = token;
      _deviceId = deviceId;
      _headers = headers;
      _isLoadingParams = false;
    });
  }

  @override
  void dispose() {
    _disableScreenProtection();
    _pageController.dispose();
    _scaleStateController.dispose();
    super.dispose();
  }

  void _onPageChanged(int index) {
    setState(() {
      _currentPage = index + 1;
      // Reset zoom when changing pages
      _scaleStateController.scaleState = PhotoViewScaleState.initial;
    });
  }

  void _nextPage(int pageCount) {
    if (_currentPage < pageCount) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _prevPage() {
    if (_currentPage > 1) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _toggleControls() {
    setState(() {
      _showControls = !_showControls;
    });
  }

  void _resetZoom() {
    _scaleStateController.scaleState = PhotoViewScaleState.initial;
  }

  // Note: PhotoViewScaleStateController doesn't have simple 'zoomBy'
  // It uses scaleState. For finer control we'd need PhotoViewController.
  // But for simple Reset/Toggle, ScaleState is easier.
  // Let's use PhotoViewController instead for actual zoom levels if needed.
  // For now, let's stick to Reset and maybe a toggle.

  @override
  Widget build(BuildContext context) {
    if (_isLoadingParams) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(
          child: CircularProgressIndicator(color: Color(0xFFbe1e2d)),
        ),
      );
    }

    final int pageCount = widget.document.pageCount ?? 0;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Gallery
          GestureDetector(
            onTap: _toggleControls,
            child: PhotoViewGallery.builder(
              scrollPhysics: const BouncingScrollPhysics(),
              builder: (BuildContext context, int index) {
                final pageNum = index + 1;
                // Build image URL carefully to avoid "null" strings being sent as parameters
                String imageUrl =
                    '${ApiClient.baseUrl}/documents/${widget.document.id}/pages/$pageNum';
                List<String> queryParams = [];
                if (_deviceId != null) {
                  queryParams.add('device_id=$_deviceId');
                }
                if (_authToken != null) {
                  queryParams.add('token=$_authToken');
                }
                if (queryParams.isNotEmpty) {
                  imageUrl += '?${queryParams.join('&')}';
                }

                return PhotoViewGalleryPageOptions(
                  imageProvider: CachedNetworkImageProvider(
                    imageUrl,
                    // Only send headers if NOT on Web to avoid preflight issues
                    headers:
                        (const bool.fromEnvironment('dart.library.js_util') ||
                            identical(0, 0.0))
                        ? null
                        : _headers,
                  ),
                  scaleStateController: _scaleStateController,
                  initialScale: PhotoViewComputedScale.contained,
                  minScale: PhotoViewComputedScale.contained * 0.8,
                  maxScale: PhotoViewComputedScale.covered * 2,
                  heroAttributes: PhotoViewHeroAttributes(tag: "page_$pageNum"),
                  errorBuilder: (context, error, stackTrace) => Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.broken_image,
                          color: Colors.white,
                          size: 50,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          "Failed to load page $pageNum",
                          style: GoogleFonts.inter(color: Colors.white),
                        ),
                        TextButton(
                          onPressed: () {
                            // Force reload?
                            setState(() {});
                          },
                          child: const Text(
                            "Retry",
                            style: TextStyle(color: Color(0xFFbe1e2d)),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
              itemCount: pageCount > 0 ? pageCount : 1, // Fallback if 0
              loadingBuilder: (context, event) => Center(
                child: CircularProgressIndicator(
                  color: const Color(0xFFbe1e2d),
                  value: event == null
                      ? null
                      : event.cumulativeBytesLoaded /
                            (event.expectedTotalBytes ?? 1),
                ),
              ),
              backgroundDecoration: const BoxDecoration(color: Colors.black),
              pageController: _pageController,
              onPageChanged: _onPageChanged,
            ),
          ),

          // Top Bar (Back Button)
          AnimatedPositioned(
            duration: const Duration(milliseconds: 300),
            top: _showControls ? 0 : -80,
            left: 0,
            right: 0,
            child: Container(
              padding: EdgeInsets.fromLTRB(
                16,
                MediaQuery.of(context).padding.top + 8,
                16,
                16,
              ),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Colors.black87, Colors.transparent],
                ),
              ),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      widget.document.title,
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Bottom Bar (Navigation Controls)
          AnimatedPositioned(
            duration: const Duration(milliseconds: 300),
            bottom: _showControls ? 24 : -100,
            left: 24,
            right: 24,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.7),
                  borderRadius: BorderRadius.circular(40),
                  border: Border.all(color: Colors.white.withOpacity(0.1)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.3),
                      blurRadius: 15,
                      spreadRadius: 5,
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Previous Button
                    IconButton(
                      onPressed: _currentPage > 1 ? _prevPage : null,
                      icon: const Icon(Icons.chevron_left, color: Colors.white),
                      disabledColor: Colors.white24,
                      tooltip: "Previous Page",
                    ),

                    // Page Indicator
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: Colors.white.withOpacity(0.1),
                        ),
                      ),
                      child: Row(
                        children: [
                          Text(
                            '$_currentPage',
                            style: GoogleFonts.inter(
                              color: const Color(0xFFbe1e2d),
                              fontWeight: FontWeight.w900,
                              fontSize: 14,
                            ),
                          ),
                          Text(
                            ' / ${pageCount > 0 ? pageCount : "?"}',
                            style: GoogleFonts.inter(
                              color: Colors.white70,
                              fontWeight: FontWeight.w600,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),

                    IconButton(
                      onPressed: _currentPage < (pageCount > 0 ? pageCount : 1)
                          ? () => _nextPage(pageCount)
                          : null,
                      icon: const Icon(
                        Icons.chevron_right,
                        color: Colors.white,
                      ),
                      disabledColor: Colors.white24,
                      tooltip: "Next Page",
                    ),

                    const SizedBox(
                      height: 24,
                      child: VerticalDivider(
                        color: Colors.white24,
                        width: 24,
                        thickness: 1,
                      ),
                    ),

                    // Zoom Reset Button
                    IconButton(
                      onPressed: _resetZoom,
                      icon: const Icon(Icons.zoom_out_map, color: Colors.white),
                      tooltip: "Reset Zoom",
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
