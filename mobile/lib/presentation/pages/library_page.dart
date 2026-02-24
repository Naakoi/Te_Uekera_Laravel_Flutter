import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import '/data/models/document_model.dart';
import '/presentation/blocs/document_bloc.dart';
import '/presentation/blocs/document_state.dart';
import '/presentation/blocs/auth/auth_bloc.dart';
import '/presentation/blocs/auth/auth_state.dart';
import 'document_details_page.dart';
import 'login_page.dart';
import 'package:url_launcher/url_launcher.dart';

class LibraryPage extends StatefulWidget {
  const LibraryPage({super.key});

  @override
  State<LibraryPage> createState() => _LibraryPageState();
}

class _LibraryPageState extends State<LibraryPage> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _sortBy = 'newest'; // 'newest', 'oldest', 'alphabetical'
  bool _isGridView = true;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<DocumentModel> _getFilteredAndSortedDocuments(
    List<DocumentModel> documents,
  ) {
    List<DocumentModel> filtered = documents
        .where((doc) => doc.hasAccess)
        .where((doc) {
          final matchesSearch =
              doc.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
              (doc.description?.toLowerCase().contains(
                    _searchQuery.toLowerCase(),
                  ) ??
                  false);
          return matchesSearch;
        })
        .toList();

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
              _buildLibraryHeader(context),
              _buildControls(context),
              SliverPadding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                sliver: BlocBuilder<AuthBloc, AuthState>(
                  builder: (context, authState) {
                    if (authState is! AuthAuthenticated) {
                      return SliverToBoxAdapter(
                        child: _buildLoginPrompt(context),
                      );
                    }

                    return BlocBuilder<DocumentBloc, DocumentState>(
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
                              child: _buildEmptyState(),
                            );
                          }

                          if (_isGridView) {
                            return SliverGrid(
                              gridDelegate:
                                  SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: crossAxisCount,
                                    childAspectRatio: 0.65,
                                    crossAxisSpacing: 12,
                                    mainAxisSpacing: 24,
                                  ),
                              delegate: SliverChildBuilderDelegate(
                                (context, index) => _buildPremierCard(
                                  context,
                                  documents[index],
                                ),
                                childCount: documents.length,
                              ),
                            );
                          } else {
                            return SliverList(
                              delegate: SliverChildBuilderDelegate(
                                (context, index) => Center(
                                  child: ConstrainedBox(
                                    constraints: const BoxConstraints(
                                      maxWidth: 800,
                                    ),
                                    child: Padding(
                                      padding: const EdgeInsets.only(
                                        bottom: 16,
                                      ),
                                      child: _buildLibraryItem(
                                        context,
                                        documents[index],
                                      ),
                                    ),
                                  ),
                                ),
                                childCount: documents.length,
                              ),
                            );
                          }
                        } else if (state is DocumentError) {
                          return SliverToBoxAdapter(
                            child: Center(child: Text(state.message)),
                          );
                        }
                        return const SliverToBoxAdapter(
                          child: SizedBox.shrink(),
                        );
                      },
                    );
                  },
                ),
              ),
              const SliverPadding(padding: EdgeInsets.only(bottom: 100)),
            ],
          );
        },
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
    );
  }

  Widget _buildLibraryHeader(BuildContext context) {
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
                    color: const Color(0xFFbe1e2d).withOpacity(0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Text(
                'YOUR PRIVATE COLLECTION',
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
              'MY LIBRARY',
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
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: TextField(
                controller: _searchController,
                onChanged: (value) => setState(() => _searchQuery = value),
                decoration: InputDecoration(
                  hintText: 'Search my editions...',
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
            Row(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildSortChip('Newest', 'newest'),
                        const SizedBox(width: 8),
                        _buildSortChip('Oldest', 'oldest'),
                        const SizedBox(width: 8),
                        _buildSortChip('A-Z', 'alphabetical'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
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
          ],
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
                : Colors.black.withOpacity(0.1),
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
              ? const Color(0xFFbe1e2d).withOpacity(0.1)
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

  Widget _buildLoginPrompt(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.lock_outline, size: 80, color: Color(0xFFbe1e2d)),
          const SizedBox(height: 24),
          Text(
            'YOUR PRIVATE LIBRARY',
            style: GoogleFonts.playfairDisplay(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              color: const Color(0xFF1a1a1a),
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          Text(
            'Log in to access your purchased editions and activation codes.',
            style: GoogleFonts.sourceSerif4(
              fontSize: 16,
              color: Colors.grey[700],
              fontStyle: FontStyle.italic,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 48),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const LoginPage()),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFbe1e2d),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 20),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: Text(
                'LOGIN TO ACCESS',
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.2,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: () async {
              const url =
                  'https://phplaravel-1593166-6235114.cloudwaysapps.com/register';
              final uri = Uri.parse(url);
              if (await canLaunchUrl(uri)) {
                await launchUrl(uri);
              }
            },
            child: Text(
              'DON\'T HAVE AN ACCOUNT? SIGN UP',
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: const Color(0xFFbe1e2d),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.only(top: 80),
        child: Column(
          children: [
            const Icon(
              Icons.library_books_outlined,
              size: 64,
              color: Colors.grey,
            ),
            const SizedBox(height: 16),
            Text(
              _searchQuery.isEmpty
                  ? 'Your library is empty.'
                  : 'No editions found matching your search.',
              style: GoogleFonts.inter(fontSize: 16, color: Colors.grey),
            ),
            if (_searchQuery.isNotEmpty)
              TextButton(
                onPressed: () {
                  _searchController.clear();
                  setState(() => _searchQuery = '');
                },
                child: const Text(
                  'Clear search',
                  style: TextStyle(color: Color(0xFFbe1e2d)),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildPremierCard(BuildContext context, DocumentModel document) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => DocumentDetailsPage(document: document),
        ),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Expanded(
              child: Stack(
                fit: StackFit.expand,
                children: [
                  Container(
                    color: const Color(0xFFe5e5e5),
                    child: document.thumbnailPath != null
                        ? Image.network(
                            'https://phplaravel-1593166-6235114.cloudwaysapps.com/api/images/${document.thumbnailPath}',
                            fit: BoxFit.cover,
                          )
                        : const Center(
                            child: Icon(Icons.newspaper, color: Colors.grey),
                          ),
                  ),
                  Positioned.fill(
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            Colors.black.withOpacity(0.4),
                          ],
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.check,
                        size: 12,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
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
                      fontStyle: FontStyle.italic,
                      color: const Color(0xFF1a1a1a),
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    document.publishedAt?.toString().split(' ')[0] ?? '',
                    style: GoogleFonts.inter(fontSize: 10, color: Colors.grey),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLibraryItem(BuildContext context, DocumentModel document) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          width: 60,
          height: 80,
          decoration: BoxDecoration(
            color: Colors.grey[200],
            borderRadius: BorderRadius.circular(8),
            image: document.thumbnailPath != null
                ? DecorationImage(
                    image: NetworkImage(
                      'https://phplaravel-1593166-6235114.cloudwaysapps.com/api/images/${document.thumbnailPath}',
                    ),
                    fit: BoxFit.cover,
                  )
                : null,
          ),
          child: document.thumbnailPath == null
              ? const Icon(Icons.newspaper, color: Colors.grey)
              : null,
        ),
        title: Text(
          document.title,
          style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              document.publishedAt?.toString().split(' ')[0] ?? 'Unknown Date',
              style: GoogleFonts.inter(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.green.withOpacity(0.1),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                'PURCHASED',
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: Colors.green,
                ),
              ),
            ),
          ],
        ),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => DocumentDetailsPage(document: document),
            ),
          );
        },
      ),
    );
  }
}
