import * as zlib from 'zlib';
import { logger } from './logger';

/**
 * Pure Node.js streaming PDF text extractor.
 * Extracts textual content from unencrypted PDF streams, FlateDecode objects,
 * and text drawing operators (/BT ... /ET, Tj, TJ) without external dependencies.
 */
export class PdfExtractor {
  /**
   * Extract text from a PDF Buffer
   */
  static extractTextFromBuffer(buffer: Buffer): string {
    try {
      const extractedParagraphs: string[] = [];
      const content = buffer.toString('binary');

      // 1. Find all stream objects in the PDF
      const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
      let match: RegExpExecArray | null;

      while ((match = streamRegex.exec(content)) !== null) {
        const streamData = match[1];
        const streamStart = match.index;

        // Check if stream is FlateDecode (Deflate compressed)
        const headerSlice = content.slice(Math.max(0, streamStart - 400), streamStart);
        const isFlateDecode = /\/Filter\s*(?:\[\s*)?\/FlateDecode/i.test(headerSlice);

        let decompressedText = '';
        if (isFlateDecode) {
          try {
            const rawBytes = Buffer.from(streamData, 'binary');
            const decompressed = zlib.inflateSync(rawBytes);
            decompressedText = decompressed.toString('utf-8');
          } catch {
            // Some streams might have slightly differing headers or corrupt chunks, try raw inflate
            try {
              const rawBytes = Buffer.from(streamData, 'binary');
              const decompressed = zlib.inflateRawSync(rawBytes);
              decompressedText = decompressed.toString('utf-8');
            } catch {
              // Ignore uncompressable binary streams (e.g. images, fonts)
            }
          }
        } else {
          decompressedText = streamData;
        }

        if (decompressedText) {
          const textBlocks = this.extractTextFromOperators(decompressedText);
          if (textBlocks.length > 0) {
            extractedParagraphs.push(...textBlocks);
          }
        }
      }

      // If stream extraction found nothing, attempt direct text literal extraction
      if (extractedParagraphs.length === 0) {
        const directLiteralRegex = /\(([^()]{3,})\)\s*Tj/g;
        while ((match = directLiteralRegex.exec(content)) !== null) {
          const clean = this.cleanPdfString(match[1]);
          if (clean.length > 2) {
            extractedParagraphs.push(clean);
          }
        }
      }

      // Deduplicate and combine into structured text
      const cleanLines = extractedParagraphs
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      const uniqueLines: string[] = [];
      let lastLine = '';
      for (const line of cleanLines) {
        if (line !== lastLine) {
          uniqueLines.push(line);
          lastLine = line;
        }
      }

      return uniqueLines.join('\n\n').trim();
    } catch (err: any) {
      logger.warn(`PDF extraction notice: ${err.message}`);
      return '';
    }
  }

  /**
   * Parse PDF text drawing operators: BT (Begin Text) ... ET (End Text), Tj and TJ
   */
  private static extractTextFromOperators(streamContent: string): string[] {
    const paragraphs: string[] = [];
    const btRegex = /BT[\r\n]+([\s\S]*?)ET/g;
    let btMatch: RegExpExecArray | null;

    while ((btMatch = btRegex.exec(streamContent)) !== null) {
      const block = btMatch[1];
      const textTokens: string[] = [];

      // Operator 1: (Text) Tj
      const tjRegex = /\(([^()]*)\)\s*Tj/g;
      let tjMatch: RegExpExecArray | null;
      while ((tjMatch = tjRegex.exec(block)) !== null) {
        const str = this.cleanPdfString(tjMatch[1]);
        if (str) textTokens.push(str);
      }

      // Operator 2: [(T) -10 (e) 20 (x) (t)] TJ
      const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
      let arrayMatch: RegExpExecArray | null;
      while ((arrayMatch = tjArrayRegex.exec(block)) !== null) {
        const innerArray = arrayMatch[1];
        const innerParts = innerArray.match(/\(([^()]*)\)/g);
        if (innerParts) {
          const combined = innerParts
            .map((p) => this.cleanPdfString(p.slice(1, -1)))
            .join('');
          if (combined) textTokens.push(combined);
        }
      }

      // Operator 3: <HexText> Tj
      const hexTjRegex = /<([0-9a-fA-F]+)>\s*Tj/g;
      let hexMatch: RegExpExecArray | null;
      while ((hexMatch = hexTjRegex.exec(block)) !== null) {
        const hex = hexMatch[1];
        let decoded = '';
        for (let i = 0; i < hex.length; i += 2) {
          const code = parseInt(hex.substr(i, 2), 16);
          if (code >= 32 && code <= 126) decoded += String.fromCharCode(code);
        }
        if (decoded.trim()) textTokens.push(decoded.trim());
      }

      if (textTokens.length > 0) {
        const paragraph = textTokens.join(' ').replace(/\s+/g, ' ').trim();
        if (paragraph.length > 3) {
          paragraphs.push(paragraph);
        }
      }
    }

    return paragraphs;
  }

  /**
   * Unescape standard PDF octal and escaped characters
   */
  private static cleanPdfString(raw: string): string {
    return raw
      .replace(/\\([0-7]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
      .replace(/\\n/g, ' ')
      .replace(/\\r/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/\\b/g, '')
      .replace(/\\f/g, '')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .trim();
  }
}
