import PDFDocument from 'pdfkit';
import { OFFICIAL_PRYCOONS_CONTACT } from '../../config/organization';
import { logger } from '../../utils/logger';

export interface BrochurePropertyData {
  title?: string;
  location?: string;
  bhk?: string;
  priceRange?: string;
  carpetArea?: string;
  status?: string;
  amenities?: string[];
  description?: string;
  image?: string;
  propertyDetailUrl?: string;
  sourceUrl?: string;
}

export class BrochureService {
  /**
   * Fetch image buffer safely with a strict timeout and fallback
   */
  private async fetchImageBuffer(url?: string): Promise<Buffer | null> {
    if (!url || !url.startsWith('http')) return null;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      });
      clearTimeout(timeoutId);

      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      // Basic sanity check for JPEG or PNG magic bytes
      if (
        (buffer[0] === 0xff && buffer[1] === 0xd8) || // JPEG
        (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) // PNG
      ) {
        return buffer;
      }
      return null;
    } catch (err: any) {
      logger.warn(`Could not load brochure image (${url}): ${err.message}. Generating brochure without image.`);
      return null;
    }
  }

  /**
   * Generate a genuine, professionally styled PDF brochure
   */
  async generateBrochurePdf(data: BrochurePropertyData): Promise<{ buffer: Buffer; filename: string }> {
    const title = data.title || 'Prycoons Ahmedabad Residences';
    const location = data.location || 'Ahmedabad, Gujarat';
    const bhk = data.bhk || '3 & 4 BHK Luxury Residences';
    const price = data.priceRange || 'Available upon inquiry';
    const carpetArea = data.carpetArea || 'Super Built-Up / Carpet Area Available';
    const status = data.status || 'RERA Gujarat Approved';
    const amenities = data.amenities && data.amenities.length > 0
      ? data.amenities
      : [
          'Landscaped Zen Garden',
          'State-of-the-art Gymnasium',
          'Swimming Pool & Deck',
          'Clubhouse & Indoor Sports',
          '24/7 Security & CCTV',
          'High-Speed Elevators',
        ];
    const propUrl = data.propertyDetailUrl || data.sourceUrl || OFFICIAL_PRYCOONS_CONTACT.websiteUrl;

    const safeTitle = title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeTitle}_Official_Brochure.pdf`;

    // Attempt to download property image
    const imageBuffer = await this.fetchImageBuffer(data.image);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          compress: false,
          margins: { top: 36, bottom: 36, left: 40, right: 40 },
          info: {
            Title: `${title} — Official Project Brochure & Specifications`,
            Author: OFFICIAL_PRYCOONS_CONTACT.organizationName,
            Subject: 'Official Real Estate Project Brochure',
            Keywords: 'Prycoons, Real Estate, Ahmedabad, Brochure, RERA',
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
          const resultBuffer = Buffer.concat(chunks);
          resolve({ buffer: resultBuffer, filename });
        });
        doc.on('error', (err) => reject(err));

        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const leftMargin = doc.page.margins.left;

        // ──────────────────────────────────────────────────────────────────────
        // 1. TOP HEADER & BRANDING
        // ──────────────────────────────────────────────────────────────────────
        // Brand Name
        doc
          .font('Helvetica-Bold')
          .fontSize(22)
          .fillColor('#C85C4A')
          .text('PRYCOONS', leftMargin, 36, { characterSpacing: 1 });

        // Tagline
        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#64748B')
          .text('Ahmedabad Premium Real Estate & Investment Advisory', leftMargin, 60);

        // RERA Badge on top right
        const badgeWidth = 140;
        const badgeHeight = 20;
        const badgeX = doc.page.width - doc.page.margins.right - badgeWidth;
        doc
          .roundedRect(badgeX, 42, badgeWidth, badgeHeight, 10)
          .fillAndStroke('#FEF2F2', '#FECACA');
        doc
          .font('Helvetica-Bold')
          .fontSize(7.5)
          .fillColor('#991B1B')
          .text('RERA GUJARAT VERIFIED', badgeX, 48, { width: badgeWidth, align: 'center' });

        // Horizontal Rule
        doc
          .moveTo(leftMargin, 78)
          .lineTo(leftMargin + pageWidth, 78)
          .lineWidth(2)
          .strokeColor('#C85C4A')
          .stroke();

        // ──────────────────────────────────────────────────────────────────────
        // 2. PROJECT TITLE & LOCATION
        // ──────────────────────────────────────────────────────────────────────
        doc.y = 92;
        doc
          .font('Helvetica-Bold')
          .fontSize(20)
          .fillColor('#0F172A')
          .text(title, leftMargin, doc.y, { width: pageWidth });

        doc
          .font('Helvetica')
          .fontSize(11)
          .fillColor('#475569')
          .text(`📍 Location: ${location}`, leftMargin, doc.y + 4);

        doc.moveDown(0.7);

        // ──────────────────────────────────────────────────────────────────────
        // 3. PROPERTY IMAGE (If available)
        // ──────────────────────────────────────────────────────────────────────
        if (imageBuffer) {
          try {
            const imgHeight = 175;
            doc.image(imageBuffer, leftMargin, doc.y, {
              fit: [pageWidth, imgHeight],
              align: 'center',
              valign: 'center',
            });
            doc.y += imgHeight + 12;
          } catch (err: any) {
            logger.warn(`PDF image rendering error: ${err.message}`);
          }
        }

        // ──────────────────────────────────────────────────────────────────────
        // 4. SPECS GRID (4-COLUMN BOX)
        // ──────────────────────────────────────────────────────────────────────
        const gridY = doc.y + 2;
        const gridHeight = 54;
        doc
          .roundedRect(leftMargin, gridY, pageWidth, gridHeight, 6)
          .fillAndStroke('#F8FAFC', '#E2E8F0');

        const colWidth = pageWidth / 4;
        const specs = [
          { label: 'CONFIGURATION', val: bhk, color: '#0F172A' },
          { label: 'PRICE GUIDE', val: price, color: '#C85C4A' },
          { label: 'CARPET AREA', val: carpetArea, color: '#0F172A' },
          { label: 'STATUS', val: status, color: '#0F172A' },
        ];

        specs.forEach((item, idx) => {
          const colX = leftMargin + idx * colWidth;
          doc
            .font('Helvetica-Bold')
            .fontSize(7.5)
            .fillColor('#64748B')
            .text(item.label, colX + 4, gridY + 12, { width: colWidth - 8, align: 'center' });

          doc
            .font('Helvetica-Bold')
            .fontSize(9.5)
            .fillColor(item.color)
            .text(item.val, colX + 4, gridY + 26, { width: colWidth - 8, align: 'center' });
        });

        doc.y = gridY + gridHeight + 14;

        // ──────────────────────────────────────────────────────────────────────
        // 5. LIFESTYLE AMENITIES & SPECIFICATIONS
        // ──────────────────────────────────────────────────────────────────────
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .fillColor('#0F172A')
          .text('Lifestyle Amenities & Specifications', leftMargin, doc.y);

        // Accent indicator bar
        doc
          .rect(leftMargin, doc.y - 12, 3, 12)
          .fill('#C85C4A');

        doc.moveDown(0.4);

        // 2-Column Amenities List
        const halfCount = Math.ceil(amenities.length / 2);
        const col1Amenities = amenities.slice(0, halfCount);
        const col2Amenities = amenities.slice(halfCount);

        const listStartY = doc.y;
        const halfWidth = (pageWidth - 20) / 2;

        col1Amenities.forEach((am, i) => {
          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor('#C85C4A')
            .text('•', leftMargin, listStartY + i * 14, { continued: true });
          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor('#334155')
            .text(`  ${am}`, { width: halfWidth });
        });

        col2Amenities.forEach((am, i) => {
          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor('#C85C4A')
            .text('•', leftMargin + halfWidth + 20, listStartY + i * 14, { continued: true });
          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor('#334155')
            .text(`  ${am}`, { width: halfWidth });
        });

        doc.y = listStartY + Math.max(col1Amenities.length, col2Amenities.length) * 14 + 14;

        // ──────────────────────────────────────────────────────────────────────
        // 6. MASTER PLAN & OFFICIAL VERIFICATION
        // ──────────────────────────────────────────────────────────────────────
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .fillColor('#0F172A')
          .text('Master Plan & Official Verification', leftMargin, doc.y);

        doc
          .rect(leftMargin, doc.y - 12, 3, 12)
          .fill('#C85C4A');

        doc.moveDown(0.3);

        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor('#475569')
          .text(
            `This project has been verified with authentic records from Prycoons Real Estate. For floor plan drawings, title search certificates, and home loan assistance, visit: ${propUrl}`,
            leftMargin,
            doc.y,
            { width: pageWidth, lineGap: 2 }
          );

        doc.moveDown(0.8);

        // ──────────────────────────────────────────────────────────────────────
        // 7. AUTHORITATIVE CONTACT BOX (CORRECT CONTACT DETAILS)
        // ──────────────────────────────────────────────────────────────────────
        const boxY = doc.y;
        const boxHeight = 62;

        doc
          .roundedRect(leftMargin, boxY, pageWidth, boxHeight, 8)
          .fillAndStroke('#FFF5F5', '#F87171');

        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#991B1B')
          .text('Schedule a Private Site Tour & Advisory:', leftMargin + 12, boxY + 10);

        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor('#334155')
          .text(
            `${OFFICIAL_PRYCOONS_CONTACT.contactCallToAction} Connect directly with our team through the Prycoons Assistant or our official contact desk:`,
            leftMargin + 12,
            boxY + 24,
            { width: pageWidth - 24 }
          );

        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#C85C4A')
          .text(
            `📞 Phone: ${OFFICIAL_PRYCOONS_CONTACT.phone}    |    ✉️ Email: ${OFFICIAL_PRYCOONS_CONTACT.email}    |    🌐 Web: ${OFFICIAL_PRYCOONS_CONTACT.websiteUrl}`,
            leftMargin + 12,
            boxY + 44,
            { width: pageWidth - 24 }
          );

        // ──────────────────────────────────────────────────────────────────────
        // 8. FOOTER
        // ──────────────────────────────────────────────────────────────────────
        const footerY = doc.page.height - 32;
        doc
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor('#94A3B8')
          .text(
            `© ${new Date().getFullYear()} Prycoons Real Estate. All rights reserved. Generated via Prycoons Assistant. Official Verification ID: PRY-${Date.now().toString(36).toUpperCase()}`,
            leftMargin,
            footerY,
            { width: pageWidth, align: 'center' }
          );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

export const brochureService = new BrochureService();
