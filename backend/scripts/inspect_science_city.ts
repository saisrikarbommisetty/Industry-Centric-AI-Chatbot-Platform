import * as cheerio from 'cheerio';
import { localityDiscoveryService } from '../src/services/crawler/localityDiscovery.service';

async function main() {
  const urls = [
    'https://prycoons.com/properties-in-science-city-ahmedabad/',
    'https://prycoons.com/3-bhk-flats-in-science-city-ahmedabad/',
    'https://prycoons.com/area/science-city/'
  ];

  for (const u of urls) {
    try {
      const res = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      console.log(`\nURL: ${u} | Status: ${res.status}`);
      if (res.status === 200) {
        const html = await res.text();
        const $ = cheerio.load(html);
        console.log('Page Title:', $('title').text());
        const cards = $('.item-wrap, [data-listid], article.property-item');
        console.log('Card elements found:', cards.length);
        cards.each((i, el) => {
          const $card = $(el);
          const title = $card.find('.item-title, h2, h3').first().text().trim().replace(/\s+/g, ' ');
          const beds = $card.find('.h-beds, .item-amenities .h-beds').text().trim().replace(/\s+/g, ' ');
          const price = $card.find('.item-price-wrap, .price, .item-price').first().text().trim().replace(/\s+/g, ' ');
          const allText = $card.text().replace(/\s+/g, ' ');
          console.log(`  Card ${i+1}: "${title}" | Beds: "${beds}" | Price: "${price}"`);
        });
      }
    } catch (err: any) {
      console.log(`Error fetching ${u}:`, err.message);
    }
  }

  // Also check parsePropertiesFromHtml on Science City
  const scPage = await localityDiscoveryService.discoverLocalityPage('Science City');
  if (scPage && 'html' in scPage) {
    console.log('\n--- parsePropertiesFromHtml on discovered page ---');
    console.log('Discovered URL:', scPage.url);
    const parsed = localityDiscoveryService.parsePropertiesFromHtml(scPage.html, scPage.url, 'Science City');
    console.log('Parsed count:', parsed.length);
    console.log(JSON.stringify(parsed, null, 2));
  }
}

main().catch(console.error);
