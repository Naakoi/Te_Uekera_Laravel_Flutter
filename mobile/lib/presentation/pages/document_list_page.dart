import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import '/presentation/blocs/document_bloc.dart';
import '/presentation/blocs/document_event.dart';
import '/presentation/blocs/document_state.dart';
import '/data/models/document_model.dart';
import 'document_details_page.dart';

class DocumentListPage extends StatefulWidget {
  const DocumentListPage({super.key});

  @override
  State<DocumentListPage> createState() => _DocumentListPageState();
}

class _DocumentListPageState extends State<DocumentListPage> {
  final TextEditingController _searchController = TextEditingController();
  bool _isGridView = true;
  String _searchQuery = '';
  String _sortBy =
      'newest'; // 'newest', 'oldest', 'price_low', 'price_high', 'alphabetical'
  String _filterStatus = 'all'; // 'all', 'purchased', 'available'

  bool _isNew(DocumentModel doc) {
    if (doc.publishedAt == null) return false;
    final cutoff = DateTime.now().subtract(const Duration(days: 3));
    return doc.publishedAt!.isAfter(cutoff);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<DocumentModel> _getFilteredAndSortedDocuments(
    List<DocumentModel> documents,
  ) {
    List<DocumentModel> filtered = documents.where((doc) {
      final matchesSearch =
          doc.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          (doc.description?.toLowerCase().contains(
                _searchQuery.toLowerCase(),
              ) ??
              false);

      bool matchesFilter = true;
      if (_filterStatus == 'purchased') {
        matchesFilter = doc.hasAccess;
      } else if (_filterStatus == 'available') {
        matchesFilter = !doc.hasAccess;
      }

      return matchesSearch && matchesFilter;
    }).toList();

    // Sort
    switch (_sortBy) {
      case 'newest':
        filtered.sort(
          (a, b) => (b.publishedAt ?? DateTime(0)).compareTo(
            a.publishedAt ?? DateTime(0),
          ),
        );
        break;
      case 'oldest':
        filtered.sort(
          (a, b) => (a.publishedAt ?? DateTime(0)).compareTo(
            b.publishedAt ?? DateTime(0),
          ),
        );
        break;
      case 'price_low':
        filtered.sort(
          (a, b) => (double.tryParse(a.price) ?? 0).compareTo(
            double.tryParse(b.price) ?? 0,
          ),
        );
        break;
      case 'price_high':
        filtered.sort(
          (a, b) => (double.tryParse(b.price) ?? 0).compareTo(
            double.tryParse(a.price) ?? 0,
          ),
        );
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.title.compareTo(b.title));
        break;
    }

    return filtered;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFf4f1ea),
      body: LayoutBuilder(
        builder: (context, constraints) {
          int crossAxisCount = 1;
          if (constraints.maxWidth > 900) {
            crossAxisCount = 4;
          } else if (constraints.maxWidth > 600) {
            crossAxisCount = 3;
          } else if (constraints.maxWidth > 400) {
            crossAxisCount = 2;
          }

          return CustomScrollView(
            slivers: [
              _buildAppBar(context),
              _buildShopHeader(context),
              _buildControls(context),
              SliverPadding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                sliver: BlocBuilder<DocumentBloc, DocumentState>(
                  builder: (context, state) {
                    if (state is DocumentLoading) {
                      return const SliverToBoxAdapter(
                        child: Center(
                          child: Padding(
                            padding: EdgeInsets.only(top: 100),
                            child: CircularProgressIndicator(
                              color: Color(0xFFbe1e2d),
                            ),
                          ),
                        ),
                      );
                    } else if (state is DocumentLoaded) {
                      final documents = _getFilteredAndSortedDocuments(
                        state.documents,
                      );

                      if (documents.isEmpty) {
                        return SliverToBoxAdapter(
                          child: Center(
                            child: Padding(
                              padding: const EdgeInsets.only(top: 100),
                              child: Column(
                                children: [
                                  Icon(
                                    Icons.search_off,
                                    size: 64,
                                    color: Colors.grey[400],
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    'No matching editions found.',
                                    style: GoogleFonts.inter(
                                      color: Colors.grey[600],
                                    ),
                                  ),
                                  if (_searchQuery.isNotEmpty ||
                                      _filterStatus != 'all')
                                    TextButton(
                                      onPressed: () {
                                        _searchController.clear();
                                        setState(() {
                                          _searchQuery = '';
                                          _filterStatus = 'all';
                                          _sortBy = 'newest';
                                        });
                                      },
                                      child: const Text(
                                        'Clear all filters',
                                        style: TextStyle(
                                          color: Color(0xFFbe1e2d),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }

                      if (_isGridView) {
                        return SliverGrid(
                          gridDelegate:
                              SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: crossAxisCount,
                                childAspectRatio: 0.6,
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 24,
                              ),
                          delegate: SliverChildBuilderDelegate((
                            context,
                            index,
                          ) {
                            return _buildPremierCard(context, documents[index]);
                          }, childCount: documents.length),
                        );
                      } else {
                        return SliverList(
                          delegate: SliverChildBuilderDelegate((
                            context,
                            index,
                          ) {
                            // In list view, we might want to constrain width on large screens
                            return Center(
                              child: ConstrainedBox(
                                constraints: const BoxConstraints(
                                  maxWidth: 800,
                                ),
                                child: Padding(
                                  padding: const EdgeInsets.only(bottom: 16),
                                  child: _buildListItem(
                                    context,
                                    documents[index],
                                  ),
                                ),
                              ),
                            );
                          }, childCount: documents.length),
                        );
                      }
                    } else if (state is DocumentError) {
                      return SliverToBoxAdapter(
                        child: Center(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                              vertical: 80,
                              horizontal: 20,
                            ),
                            child: Column(
                              children: [
                                const Icon(
                                  Icons.error_outline,
                                  size: 48,
                                  color: Colors.red,
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'Unable to load editions.',
                                  style: GoogleFonts.inter(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.grey[700],
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  state.message,
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: Colors.grey[500],
                                    fontSize: 12,
                                  ),
                                ),
                                const SizedBox(height: 24),
                                ElevatedButton(
                                  onPressed: () => context
                                      .read<DocumentBloc>()
                                      .add(FetchDocuments()),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFFbe1e2d),
                                    foregroundColor: Colors.white,
                                  ),
                                  child: const Text('RETRY'),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }
                    return const SliverToBoxAdapter(child: SizedBox.shrink());
                  },
                ),
              ),
              const SliverPadding(padding: EdgeInsets.only(bottom: 100)),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.read<DocumentBloc>().add(FetchDocuments()),
        backgroundColor: const Color(0xFFbe1e2d),
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: const Icon(Icons.refresh),
      ),
    );
  }

  Widget _buildAppBar(BuildContext context) {
    return SliverAppBar(
      backgroundColor: const Color(0xFFf4f1ea),
      elevation: 0,
      floating: true,
      centerTitle: true,
      title: Text(
        'TE UEKERA',
        style: GoogleFonts.playfairDisplay(
          color: const Color(0xFF1a1a1a),
          fontWeight: FontWeight.w900,
          fontSize: 18,
          letterSpacing: 2,
        ),
      ),
      iconTheme: const IconThemeData(color: Colors.black),
    );
  }

  Widget _buildShopHeader(BuildContext context) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFbe1e2d),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFbe1e2d).withValues(alpha: 0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Text(
                'ARCHIVE LIBRARY',
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.w900,
                  color: Colors.white,
                  letterSpacing: 1.5,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'AVAILABLE EDITIONS',
              style: GoogleFonts.playfairDisplay(
                fontSize: 36,
                fontWeight: FontWeight.w900,
                fontStyle: FontStyle.italic,
                color: const Color(0xFF1a1a1a),
                letterSpacing: -1,
                height: 1.0,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildControls(BuildContext context) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
        child: Column(
          children: [
            // Search Bar
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: TextField(
                controller: _searchController,
                onChanged: (value) => setState(() => _searchQuery = value),
                decoration: InputDecoration(
                  hintText: 'Search for editions...',
                  hintStyle: GoogleFonts.inter(
                    color: Colors.grey[400],
                    fontSize: 14,
                  ),
                  prefixIcon: const Icon(
                    Icons.search,
                    color: Color(0xFFbe1e2d),
                  ),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, size: 20),
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _searchQuery = '');
                          },
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 15),
                ),
              ),
            ),
            const SizedBox(height: 16),
            // View Toggles and Sort
            Row(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        // Filter Status
                        _buildFilterChip('All', 'all'),
                        const SizedBox(width: 8),
                        _buildFilterChip('Purchased', 'purchased'),
                        const SizedBox(width: 8),
                        _buildFilterChip('Available', 'available'),
                        const SizedBox(width: 16),
                        Container(
                          width: 1,
                          height: 20,
                          color: Colors.grey[300],
                        ),
                        const SizedBox(width: 16),
                        // Sorts
                        _buildSortChip('Newest', 'newest'),
                        const SizedBox(width: 8),
                        _buildSortChip('Price: Low', 'price_low'),
                        const SizedBox(width: 8),
                        _buildSortChip('Price: High', 'price_high'),
                        const SizedBox(width: 8),
                        _buildSortChip('A-Z', 'alphabetical'),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                BlocBuilder<DocumentBloc, DocumentState>(
                  builder: (context, state) {
                    if (state is DocumentLoaded) {
                      final count = _getFilteredAndSortedDocuments(
                        state.documents,
                      ).length;
                      return Text(
                        '$count results',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: Colors.grey[600],
                          fontWeight: FontWeight.w500,
                        ),
                      );
                    }
                    return const SizedBox.shrink();
                  },
                ),
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      _buildViewIconButton(Icons.grid_view_rounded, true),
                      _buildViewIconButton(Icons.view_list_rounded, false),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(height: 1, color: Colors.black.withValues(alpha: 0.05)),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    bool isSelected = _filterStatus == value;
    return GestureDetector(
      onTap: () => setState(() => _filterStatus = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFFbe1e2d).withValues(alpha: 0.1)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? const Color(0xFFbe1e2d)
                : Colors.black.withValues(alpha: 0.1),
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            color: isSelected ? const Color(0xFFbe1e2d) : Colors.black87,
          ),
        ),
      ),
    );
  }

  Widget _buildSortChip(String label, String value) {
    bool isSelected = _sortBy == value;
    return GestureDetector(
      onTap: () => setState(() => _sortBy = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFbe1e2d) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? const Color(0xFFbe1e2d)
                : Colors.black.withValues(alpha: 0.1),
          ),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            color: isSelected ? Colors.white : Colors.black87,
          ),
        ),
      ),
    );
  }

  Widget _buildViewIconButton(IconData icon, bool isGrid) {
    bool isSelected = _isGridView == isGrid;
    return GestureDetector(
      onTap: () => setState(() => _isGridView = isGrid),
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFFbe1e2d).withValues(alpha: 0.1)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          icon,
          size: 20,
          color: isSelected ? const Color(0xFFbe1e2d) : Colors.grey[400],
        ),
      ),
    );
  }

  Widget _buildListItem(BuildContext context, DocumentModel document) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => DocumentDetailsPage(document: document),
          ),
        );
      },
      child: Container(
        height: 120,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.horizontal(
                left: Radius.circular(16),
              ),
              child: SizedBox(
                width: 100,
                height: 120,
                child: document.thumbnailPath != null
                    ? Image.network(
                        'http://127.0.0.1:8000/api/images/${document.thumbnailPath}',
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) =>
                            _buildPlaceholderThumbnail(),
                      )
                    : _buildPlaceholderThumbnail(),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      document.title.toUpperCase(),
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.w900,
                        fontSize: 14,
                        fontStyle: FontStyle.italic,
                        color: const Color(0xFF1a1a1a),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),

                    const SizedBox(height: 4),
                    if (_isNew(document))
                      Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.blue.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'NEW RELEASE',
                            style: GoogleFonts.inter(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: Colors.blue,
                            ),
                          ),
                        ),
                      ),
                    Text(
                      document.description ?? 'Digital archive edition.',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: Colors.grey[600],
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const Spacer(),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          document.hasAccess
                              ? 'PURCHASED'
                              : '\$${document.price}',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            color: document.hasAccess
                                ? Colors.green
                                : const Color(0xFFbe1e2d),
                          ),
                        ),
                        Icon(
                          Icons.arrow_forward_ios,
                          size: 14,
                          color: Colors.grey[300],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholderThumbnail() {
    return Container(
      color: const Color(0xFFf4f1ea),
      child: const Center(child: Icon(Icons.newspaper, color: Colors.grey)),
    );
  }

  Widget _buildPremierCard(BuildContext context, DocumentModel document) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => DocumentDetailsPage(document: document),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.7),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: Colors.white.withValues(alpha: 0.4),
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Thumbnail Section
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Container(
                    color: const Color(0xFFe5e5e5),
                    child: document.thumbnailPath != null
                        ? Image.network(
                            'http://127.0.0.1:8000/api/images/${document.thumbnailPath}',
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) =>
                                _buildPlaceholder(document),
                          )
                        : _buildPlaceholder(document),
                  ),
                  // Gradient Overlay
                  Positioned.fill(
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.black.withValues(alpha: 0.1),
                            Colors.transparent,
                            Colors.black.withValues(alpha: 0.3),
                          ],
                        ),
                      ),
                    ),
                  ),
                  // Price Tag
                  if (!document.hasAccess)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFbe1e2d),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '\$${document.price}',
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            fontSize: 10,
                          ),
                        ),
                      ),
                    )
                  else
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.green,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.check,
                          size: 12,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  if (_isNew(document))
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.blue,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.blue.withValues(alpha: 0.3),
                              blurRadius: 4,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Text(
                          'NEW',
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            fontSize: 10,
                            letterSpacing: 1.0,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),

            // Content Section
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    document.title.toUpperCase(),
                    style: GoogleFonts.inter(
                      fontWeight: FontWeight.w900,
                      fontSize: 12,
                      height: 1.1,
                      fontStyle: FontStyle.italic,
                      color: const Color(0xFF1a1a1a),
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    document.hasAccess ? 'READ NOW' : 'DIGITAL ARCHIVE',
                    style: GoogleFonts.inter(
                      fontSize: 8,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 1.0,
                      color: document.hasAccess
                          ? Colors.green
                          : Colors.black.withValues(alpha: 0.4),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholder(DocumentModel document) {
    return Container(
      color: Colors.white,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.newspaper,
              size: 64,
              color: Colors.black.withValues(alpha: 0.1),
            ),
            const SizedBox(height: 16),
            Text(
              'COVER PENDING',
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                letterSpacing: 2.0,
                color: Colors.black.withValues(alpha: 0.2),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
