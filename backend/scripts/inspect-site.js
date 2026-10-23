const https = require('https');

function fetchPage(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    }).on('error', () => resolve(''));
  });
}

function checkHead(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      resolve(res.statusCode);
    }).on('error', () => resolve(500));
  });
}

async function run() {
  const pages = [
    { name: 'Science City', url: 'https://prycoons.com/3-bhk-flats-in-science-city-ahmedabad/' },
    { name: 'Gota 3BHK', url: 'https://prycoons.com/3-bhk-flats-in-gota-ahmedabad/' },
    { name: 'Gota 2BHK', url: 'https://prycoons.com/2-bhk-flats-in-gota-ahmedabad/' },
    { name: 'Tragad 3BHK', url: 'https://prycoons.com/3-bhk-flats-in-tragad-ahmedabad/' }
  ];

  for (const page of pages) {
    console.log('\n--- Checking ' + page.name + ' ---');
    const html = await fetchPage(page.url);
    const regex = /https:\/\/prycoons\.com\/wp-content\/uploads\/[^\s"'<>]+\.(?:webp|jpg|jpeg|png)/gi;
    const all = [...new Set(html.match(regex) || [])];
    const propertyCardsImgs = all.filter(u => u.includes('-584x438'));
    console.log('Total -584x438 images found: ' + propertyCardsImgs.length);
    for (const img of propertyCardsImgs) {
      const status = await checkHead(img);
      console.log(`Status [${status}] -> ${img}`);
    }
  }
}

run();
