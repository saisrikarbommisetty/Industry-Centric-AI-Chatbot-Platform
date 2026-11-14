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
   * Split a crawled page into high-quality semantic chunks preserving entities
   */
  chunkPage(page: CrawledPage, botConfig?: { industry?: string; botName?: string; isRealEstate?: boolean }): SemanticChunk[] {
    const chunks: SemanticChunk[] = [];
    let chunkIndex = 0;
    const isPrycoons = Boolean(botConfig?.botName?.toLowerCase().includes('prycoons') || page.url.includes('prycoons.com'));
    const isRealEstate = Boolean(botConfig?.industry === 'real-estate' || botConfig?.isRealEstate || isPrycoons);

    // 1. Process structured properties from crawler metadata if available (for real estate bots)
    if (isRealEstate && page.metadata?.properties && page.metadata.properties.length > 0) {
      for (const prop of page.metadata.properties) {
        const pName = prop.projectName || 'Project';
        const loc = prop.location || page.metadata.location || (isPrycoons ? 'Ahmedabad' : '');
        const bhk = prop.bhk || prop.propertyType || '3 BHK';
        const price = prop.price || 'Price on request';
        const area = prop.carpetArea || 'Spacious layout';
        const status = prop.propertyStatus || (isPrycoons ? 'Under Construction (RERA Approved)' : 'Verified Property');
        const developer = prop.developer || (botConfig?.botName ? `${botConfig.botName} Partner` : (isPrycoons ? 'Prycoons Partner' : 'Developer'));
        const amenitiesList = prop.amenities && prop.amenities.length > 0 ? prop.amenities.join(', ') : 'Standard Amenities';

        const locStr = loc ? (isPrycoons && !loc.toLowerCase().includes('ahmedabad') ? `${loc}, Ahmedabad` : loc) : '';

        const content = `
Project: ${pName}
Developer: ${developer}
${locStr ? `Location: ${locStr}\n` : ''}Configuration: ${bhk}
Price: ${price}
Area: ${area}
Status: ${status}
Amenities: ${amenitiesList}
Source: ${prop.sourceUrl || page.url}
Verified Details: Official listing from ${botConfig?.botName || 'our website'}.
`.trim();

        chunks.push({
          content,
          metadata: {
            projectName: pName,
            developer,
            location: loc,
            city: prop.city || (isPrycoons ? 'Ahmedabad' : ''),
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
    } else if (isRealEstate) {
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

    // 2. Chunk general page text preserving semantic structure, tables, and section headings
    const text = page.extractedText;
    const rawBlocks = text
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 20 && !p.startsWith('Under Construction Rera Approved'));

    // Break down oversized blocks while preserving tables, lists, and FAQs
    const semanticBlocks: Array<{ text: string; sectionHeading?: string; isTable?: boolean }> = [];
    let currentSectionHeading = '';

    for (const block of rawBlocks) {
      // Check for section headings
      const headingMatch = block.match(/###\s+([^\n]+)/);
      if (headingMatch) {
        currentSectionHeading = headingMatch[1].trim();
      }

      // Handle Tables: split by rows, keeping table headers intact on each split
      if (block.includes('[Table Content]')) {
        const tableLines = block.split('\n').map((l) => l.trim()).filter(Boolean);
        if (tableLines.length >= 3 && block.length > this.targetChunkSize) {
          // tableLines[0] is [Table Content], tableLines[1] is Header Row
          const tableTag = tableLines[0];
          const headerRow = tableLines[1];
          const dataRows = tableLines.slice(2);

          let currentTableChunkRows: string[] = [];
          let currentTableChars = 0;

          for (const row of dataRows) {
            if (currentTableChars + row.length > this.targetChunkSize && currentTableChunkRows.length > 0) {
              semanticBlocks.push({
                text: `${tableTag}\n${headerRow}\n${currentTableChunkRows.join('\n')}`,
                sectionHeading: currentSectionHeading,
                isTable: true,
              });
              currentTableChunkRows = [row];
              currentTableChars = row.length;
            } else {
              currentTableChunkRows.push(row);
              currentTableChars += row.length;
            }
          }
          if (currentTableChunkRows.length > 0) {
            semanticBlocks.push({
              text: `${tableTag}\n${headerRow}\n${currentTableChunkRows.join('\n')}`,
              sectionHeading: currentSectionHeading,
              isTable: true,
            });
          }
          continue;
        }
      }

      // Handle Bulleted Lists: split by items rather than raw character slicing
      if (block.includes('• ') && block.length > this.targetChunkSize) {
        const items = block.split(/\n(?=• )/).map((it) => it.trim()).filter(Boolean);
        let listGroup: string[] = [];
        let listGroupChars = 0;

        for (const item of items) {
          if (listGroupChars + item.length > this.targetChunkSize && listGroup.length > 0) {
            semanticBlocks.push({
              text: listGroup.join('\n'),
              sectionHeading: currentSectionHeading,
            });
            listGroup = [item];
            listGroupChars = item.length;
          } else {
            listGroup.push(item);
            listGroupChars += item.length;
          }
        }
        if (listGroup.length > 0) {
          semanticBlocks.push({
            text: listGroup.join('\n'),
            sectionHeading: currentSectionHeading,
          });
        }
        continue;
      }

      // Generic large text blocks: split by sentence boundaries instead of arbitrary character offsets
      if (block.length > this.targetChunkSize * 1.5) {
        const sentences = block.split(/(?<=[.?!])\s+/);
        let sentenceGroup: string[] = [];
        let sentenceGroupChars = 0;

        for (const s of sentences) {
          if (sentenceGroupChars + s.length > this.targetChunkSize && sentenceGroup.length > 0) {
            semanticBlocks.push({
              text: sentenceGroup.join(' '),
              sectionHeading: currentSectionHeading,
            });
            sentenceGroup = [s];
            sentenceGroupChars = s.length;
          } else {
            sentenceGroup.push(s);
            sentenceGroupChars += s.length;
          }
        }
        if (sentenceGroup.length > 0) {
          semanticBlocks.push({
            text: sentenceGroup.join(' '),
            sectionHeading: currentSectionHeading,
          });
        }
        continue;
      }

      semanticBlocks.push({
        text: block,
        sectionHeading: currentSectionHeading,
      });
    }

    let currentChunk = '';
    let activeChunkSection = '';
    const sectionMetadata = {
      title: page.title,
      sourceUrl: page.url,
      documentType: page.metadata?.documentType || 'general_page',
      location: page.metadata?.location || (isPrycoons ? 'Ahmedabad' : ''),
      propertyType: page.metadata?.propertyType || '',
    };
    const pageHeader = page.title && page.title !== 'Website Page' && !page.title.includes('.local') ? `[Page: ${page.title}]\n` : '';

    for (const b of semanticBlocks) {
      if ((currentChunk + '\n\n' + b.text).length > this.targetChunkSize && currentChunk.length > 0) {
        const rawContent = currentChunk.trim();
        const sectionPrefix = activeChunkSection && !rawContent.includes(activeChunkSection) ? `[Section: ${activeChunkSection}]\n` : '';
        const contextualContent = `${pageHeader}${sectionPrefix}${rawContent}`.slice(0, 1400);

        chunks.push({
          content: contextualContent,
          metadata: { ...sectionMetadata, section: activeChunkSection },
          chunkIndex: chunkIndex++,
        });

        // Retain overlap from end of previous chunk if not a table
        if (!b.isTable) {
          const words = currentChunk.split(/\s+/);
          currentChunk = words.slice(-Math.min(15, words.length)).join(' ') + '\n\n' + b.text;
        } else {
          currentChunk = b.text;
        }
        activeChunkSection = b.sectionHeading || '';
      } else {
        currentChunk = currentChunk ? `${currentChunk}\n\n${b.text}` : b.text;
        if (b.sectionHeading) activeChunkSection = b.sectionHeading;
      }
    }

    if (currentChunk.trim().length > 25) {
      const rawContent = currentChunk.trim();
      const sectionPrefix = activeChunkSection && !rawContent.includes(activeChunkSection) ? `[Section: ${activeChunkSection}]\n` : '';
      const contextualContent = `${pageHeader}${sectionPrefix}${rawContent}`.slice(0, 1400);

      chunks.push({
        content: contextualContent,
        metadata: { ...sectionMetadata, section: activeChunkSection },
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
