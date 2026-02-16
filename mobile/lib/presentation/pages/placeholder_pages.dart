import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class PlaceholderPage extends StatelessWidget {
  final String title;
  final IconData icon;

  const PlaceholderPage({
    super.key,
    required this.title,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        SliverAppBar(
          expandedHeight: 120,
          backgroundColor: const Color(0xFFbe1e2d),
          pinned: true,
          flexibleSpace: FlexibleSpaceBar(
            centerTitle: true,
            title: Text(
              title.toUpperCase(),
              style: GoogleFonts.playfairDisplay(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 24,
                letterSpacing: -1,
                shadows: [
                  const Shadow(color: Colors.black, offset: Offset(0, 2), blurRadius: 4),
                ],
              ),
            ),
          ),
        ),
        SliverFillRemaining(
          child: Container(
            color: const Color(0xFFf4f1ea),
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, size: 80, color: const Color(0xFFbe1e2d).withAlpha(50)),
                  const SizedBox(height: 24),
                  Text(
                    'Welcome to the $title',
                    style: GoogleFonts.inter(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'This feature is coming soon to the mobile app.',
                    style: GoogleFonts.sourceSerif4(
                      fontSize: 16,
                      fontStyle: FontStyle.italic,
                      color: Colors.black54,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
