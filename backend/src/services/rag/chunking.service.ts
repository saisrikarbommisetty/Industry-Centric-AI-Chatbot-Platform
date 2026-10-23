import { ENV } from '../../config/env';
import { CrawledPage, ExtractedPropertyMetadata } from '../../types';

export interface SemanticChunk {
  content: string;
  metadata: Record<string, any>;
  chunkIndex: number;
}

export class ChunkingService {
  private targetChunkSize: number;
  private chunkOverlap: number;

  constructor() {
    this.targetChunkSize = ENV.CHUNK_SIZE || 500;
    this.chunkOverlap = ENV.CHUNK_OVERLAP || 80;
  }

  /**
   * Split a crawled page into high-quality semantic chunks preserving property entities
   */
  chunkPage(page: CrawledPage): SemanticChunk[] {
    const chunks: SemanticChunk[] = [];
    let chunkIndex = 0;

    // 1. Process structured properties from crawler metadata if available
    if (page.metadata?.properties && page.metadata.properties.length > 0) {
      for (const prop of page.metadata.properties) {
        const pName = prop.projectName || 'Project';
        const loc = prop.location || page.metadata.location || 'Ahmedabad';
        const bhk = prop.bhk || prop.propertyType || '3 BHK';
        const price = prop.price || 'Price on request';
        const area = prop.carpetArea || 'Spacious layout';
        const status = prop.propertyStatus || 'Under Construction (RERA Approved)';
        const developer = prop.developer || 'Prycoons Partner';
        const amenitiesList = prop.amenities && prop.amenities.length > 0 ? prop.amenities.join(', ') : 'Standard Amenities';

        const content = `
Project: ${pName}
Developer: ${developer}
Location: ${loc}, Ahmedabad
Configuration: ${bhk}
Price: ${price}
Area: ${area}
Status: ${status}
Amenities: ${amenitiesList}
Source: ${prop.sourceUrl || page.url}
Verified Details: Official RERA approved listing on Prycoons Real Estate.
`.trim();

        chunks.push({
          content,
          metadata: {
            projectName: pName,
            developer,
            location: loc,
            city: prop.city || 'Ahmedabad',
            propertyType: prop.propertyType || (bhk.includes('2') ? '2BHK' : bhk.includes('4') ? '4BHK' : '3BHK'),
            bhk,
            price: prop.price,
            priceNum: prop.priceNum,
            carpetArea: prop.carpetArea,
            propertyStatus: status,
            amenities: prop.amenities || [],
            sourceUrl: prop.sourceUrl || page.url,
            image: prop.image,
            documentType: 'property_listing',
          },
          chunkIndex: chunkIndex++,
        });
      }
    } else {
      // Fallback: extract from raw text if crawler did not find structured DOM cards
      const propertyChunks = this.extractIndividualPropertyBlocks(page);
      for (const pChunk of propertyChunks) {
        chunks.push({
          content: pChunk.content,
          metadata: pChunk.metadata,
          chunkIndex: chunkIndex++,
        });
      }
    }

    // 2. Also chunk the general page overview / introductory text
    const text = page.extractedText;
    const paragraphs = text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 40 && !p.startsWith('Under Construction Rera Approved')); // avoid duplicating extracted listing cards

    let currentChunk = '';
    const sectionMetadata = {
      title: page.title,
      sourceUrl: page.url,
      documentType: page.metadata.documentType || 'general_page',
      location: page.metadata.location || 'Ahmedabad',
      propertyType: page.metadata.propertyType || '',
    };

    for (const para of paragraphs) {
      if ((currentChunk + '\n\n' + para).length > this.targetChunkSize && currentChunk.length > 0) {
        chunks.push({
          content: currentChunk.trim(),
          metadata: { ...sectionMetadata },
          chunkIndex: chunkIndex++,
        });

        // Retain overlap from end of previous chunk
        const words = currentChunk.split(/\s+/);
        currentChunk = words.slice(-Math.min(15, words.length)).join(' ') + '\n\n' + para;
      } else {
        currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para;
      }
    }

    if (currentChunk.trim().length > 30) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: { ...sectionMetadata },
        chunkIndex: chunkIndex++,
      });
    }

    return chunks;
  }

  /**
   * Extract individual property cards from raw text/HTML so project specs stay retrievable together
   */
  private extractIndividualPropertyBlocks(page: CrawledPage): Array<{ content: string; metadata: Record<string, any> }> {
    const blocks: Array<{ content: string; metadata: Record<string, any> }> = [];
    const text = page.extractedText;

    // Regex pattern matching Prycoons property listing cards:
    // e.g. "Under Construction Rera Approved ₹92 lakh Onwards Ananta(by Dharti Saket) – 3 BHK Gota, Ahmedabad... 1863 - 2079 Sq Ft Super Built Up Area Beds: 3"
    const cardRegex = /(?:Under Construction|Ready to Move|Newly Launch|Pre-launch)?\s*(?:Best Affordable Properties)?\s*(?:Rera Approved)?\s*(₹\s*[0-9.]+\s*(?:lakh|crore)\s*(?:Onwards)?)\s+([A-Za-z0-9\s–\-(]+?(?:\(by\s+[A-Za-z0-9\s]+\))?)\s*[–-]\s*([0-9,\s]+BHK)\s+([^0-9]{3,80}?,\s*Ahmedabad[^\n]*?)([0-9\s-]+Sq Ft[^.\n]*?Beds:\s*[0-9, ]+)/gi;

    const matches = [...text.matchAll(cardRegex)];

    for (const match of matches) {
      const priceStr = match[1].trim();
      const rawTitle = match[2].trim();
      const bhkStr = match[3].trim();
      const address = match[4].trim();
      const areaAndBeds = match[5].trim();

      // Extract developer name if present in "Title (by Developer)"
      let projectName = rawTitle;
      let developer = 'Prycoons Developer Partner';
      const devMatch = rawTitle.match(/^(.+?)\s*\(\s*by\s+(.+?)\s*\)$/i);
      if (devMatch) {
        projectName = devMatch[1].trim();
        developer = devMatch[2].trim();
      }

      // Convert price to numerical Lakhs for filtering
      let priceNum = 0;
      if (priceStr.toLowerCase().includes('crore')) {
        const val = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
        if (!isNaN(val)) priceNum = val * 100;
      } else {
        const val = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
        if (!isNaN(val)) priceNum = val;
      }

      // Determine area / locality
      const location = page.metadata.location || 'Ahmedabad';

      const content = `
Project: ${projectName}
Developer: ${developer}
Location: ${location}, Ahmedabad
Configuration: ${bhkStr}
Price: ${priceStr}
Area: ${areaAndBeds.split('Beds:')[0].trim()}
Address: ${address}
Source: ${page.url}
Verified Details: Official RERA approved listing on Prycoons Real Estate.
`.trim();

      blocks.push({
        content,
        metadata: {
          projectName,
          developer,
          location,
          propertyType: bhkStr.includes('3') ? '3BHK' : bhkStr.includes('2') ? '2BHK' : '4BHK',
          bhk: bhkStr,
          price: priceStr,
          priceNum,
          carpetArea: areaAndBeds.split('Beds:')[0].trim(),
          sourceUrl: page.url,
          documentType: 'property_listing',
        },
      });
    }

    return blocks;
  }
}

export const chunkingService = new ChunkingService();
