import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class HomePage extends StatelessWidget {
  final VoidCallback onShopNow;

  const HomePage({super.key, required this.onShopNow});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFf4f1ea),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Top Info Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(bottom: BorderSide(color: Colors.black)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Ana Nuutibeeba ni koaua te I-Kiribati',
                    style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    'Reitaki nakon 63030150',
                    style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),

            // Masthead
            Container(
              color: const Color(0xFFbe1e2d),
              padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 24),
              child: Column(
                children: [
                   // Logo placeholder if we had one, for now just text
                  Text(
                    'TE UEKERA',
                    style: GoogleFonts.playfairDisplay(
                      fontSize: 48,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      height: 0.9,
                      letterSpacing: -2,
                      shadows: [
                        const Shadow(color: Colors.black, offset: Offset(2, 2), blurRadius: 0),
                        const Shadow(color: Colors.black, offset: Offset(-2, -2), blurRadius: 0),
                        const Shadow(color: Colors.black, offset: Offset(2, -2), blurRadius: 0),
                        const Shadow(color: Colors.black, offset: Offset(-2, 2), blurRadius: 0),
                        const Shadow(color: Colors.black, offset: Offset(0, 6), blurRadius: 0),
                      ],
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),

            // Issue Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
              decoration: const BoxDecoration(
                color: Color(0xFFbe1e2d),
                border: Border(
                  top: BorderSide(color: Colors.white24, width: 2),
                  bottom: BorderSide(color: Colors.black, width: 4, style: BorderStyle.solid), // Double border simulation
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Issue nambwa 1',
                    style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold, fontStyle: FontStyle.italic),
                  ),
                  Text(
                    DateTime.now().toString().split(' ')[0],
                    style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                  const Text(
                    '\$1.00',
                    style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),

            // Content
            Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Tagline
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    margin: const EdgeInsets.only(bottom: 24),
                    decoration: BoxDecoration(
                      color: const Color(0xFFbe1e2d),
                      borderRadius: BorderRadius.circular(50),
                      boxShadow: [
                        BoxShadow(color: Colors.red.withAlpha(50), blurRadius: 10, offset: const Offset(0, 4)),
                      ],
                    ),
                    child: Text(
                      'HEADLINE NEWS',
                      style: GoogleFonts.inter(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 2),
                    ),
                  ),

                  // Hero Headline
                  Text(
                    'THE FUTURE',
                    style: GoogleFonts.playfairDisplay(
                      fontSize: 48,
                      fontWeight: FontWeight.w900,
                      height: 0.9,
                      color: const Color(0xFF1a1a1a),
                    ),
                  ),
                  Text(
                    'OF NEWS,',
                    style: GoogleFonts.playfairDisplay(
                      fontSize: 48,
                      fontWeight: FontWeight.w900,
                      height: 0.9,
                      color: const Color(0xFF1a1a1a),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Stack(
                    children: [
                      Positioned(
                        bottom: 4,
                        left: 0,
                        right: 0,
                        child: Container(height: 12, color: const Color(0xFFffde00).withAlpha(128)),
                      ),
                      Text(
                        'DIGITALLY SECURED WORLD',
                        style: GoogleFonts.inter(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFFbe1e2d),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 32),

                  // Description
                  Container(
                    decoration: const BoxDecoration(
                      border: Border(left: BorderSide(color: Color(0xFFbe1e2d), width: 6)),
                    ),
                    padding: const EdgeInsets.only(left: 20, top: 4, bottom: 4),
                    child: Text(
                      'Access the latest editions of Te Uekera from anywhere in the world. High-quality news for our community.',
                      style: GoogleFonts.sourceSerif4(fontSize: 18, fontStyle: FontStyle.italic, color: Colors.black87),
                    ),
                  ),

                  const SizedBox(height: 40),

                  // CTA Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: onShopNow,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFbe1e2d),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 20),
                        elevation: 10,
                        shadowColor: const Color(0xFFbe1e2d).withAlpha(100),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: Text(
                        'BROWSE EDITIONS',
                        style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w900, letterSpacing: 2),
                      ),
                    ),
                  ),

                  const SizedBox(height: 60),

                  // Feature Cards
                  _buildFeatureCard(
                    title: 'Pay Per View',
                    description: 'Only pay for what you read. Single editions available for just \$1 each.',
                    color: Colors.white,
                    textColor: const Color(0xFFbe1e2d),
                    decoratorColor: const Color(0xFFbe1e2d),
                  ),
                  const SizedBox(height: 24),
                  _buildFeatureCard(
                    title: 'Secure Access',
                    description: 'Our advanced file protection ensures your purchased documents stay yours.',
                    color: const Color(0xFF1a1a1a),
                    textColor: const Color(0xFFffde00),
                    decoratorColor: Colors.white,
                  ),
                  const SizedBox(height: 24),
                  _buildFeatureCard(
                    title: 'Mobile App',
                    description: 'Install our app for offline reading and instant news alerts.',
                    color: const Color(0xFFffde00),
                    textColor: const Color(0xFF1e3a8a),
                    decoratorColor: Colors.black,
                  ),
                  
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureCard({
    required String title,
    required String description,
    required Color color,
    required Color textColor,
    required Color decoratorColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.black.withAlpha(20)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(30),
            offset: const Offset(0, 10),
            blurRadius: 20,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title.toUpperCase(),
            style: GoogleFonts.playfairDisplay(
              fontSize: 24,
              fontWeight: FontWeight.w900,
              color: textColor,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            description,
            style: GoogleFonts.sourceSerif4(
              fontSize: 16,
              fontStyle: FontStyle.italic,
              color: color == const Color(0xFF1a1a1a) ? Colors.white.withAlpha(230) : Colors.black87,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 24),
          Container(
            width: 40,
            height: 2,
            color: decoratorColor.withAlpha(80),
          )
        ],
      ),
    );
  }
}
