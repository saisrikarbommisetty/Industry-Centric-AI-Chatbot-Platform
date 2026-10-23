import { conversationService } from '../src/services/chatbot/conversation.service';
import { crawlerService } from '../src/services/crawler/crawler.service';
import { propertyMatcherService } from '../src/services/rag/propertyMatcher.service';
import { retrievalService } from '../src/services/rag/retrieval.service';
import { locationService } from '../src/services/location/location.service';
import { knowledgeRepository } from '../src/repositories/knowledge.repository';
import { sessionRepository } from '../src/repositories/session.repository';
import { projectRepository } from '../src/repositories/project.repository';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runChatImprovementsTests() {
  console.log('\n=======================================================');
  console.log('🧪 RUNNING BRIM CHATBOT IMPROVEMENTS REGRESSION SUITE');
  console.log('=======================================================');

  const projectId = 'prycoons-ai';

  // Ensure project exists
  await projectRepository.create({
    id: projectId,
    name: 'BRIM Real Estate Assistant',
    slug: 'prycoons-ai',
    industry: 'real-estate',
    industryName: 'Real Estate & Property',
    websiteUrl: 'https://prycoons.com/',
    leadCaptureEnabled: true,
    leadCaptureFields: ['name', 'phone'],
    isActive: true,
  });

  // Seed verified knowledge for tests
  const srcScienceCity = await knowledgeRepository.createSource({
    id: 'test-src-science-city',
    projectId,
    url: 'https://prycoons.com/3-bhk-flats-in-science-city-ahmedabad/',
    title: '3 BHK Flats in Science City Ahmedabad',
    status: 'INDEXED',
  });

  const docScienceCity = await knowledgeRepository.createDocument({
    id: 'test-doc-science-city',
    sourceId: srcScienceCity.id,
    projectId,
    title: '3 BHK Flats in Science City Ahmedabad',
    url: 'https://prycoons.com/3-bhk-flats-in-science-city-ahmedabad/',
    content: 'Aahvan Greens – 3 BHK Science City, Ahmedabad, 2448 - 3150 Sq Ft Super Built Up Area, Price: ₹1.65 crore Onwards, Status: Under Construction, Rera Approved.',
    metadata: { location: 'Science City', city: 'Ahmedabad', propertyType: '3BHK' },
    contentHash: 'hash-test-science-city',
  });

  await knowledgeRepository.createChunk({
    id: 'test-chk-aahvan',
    documentId: docScienceCity.id,
    projectId,
    content: `Project: Aahvan Greens\nDeveloper: Aahvan Group\nLocation: Science City, Ahmedabad\nConfiguration: 3 BHK\nPrice: ₹1.65 crore Onwards\nArea: 2448–3150 Sq Ft Super Built Up Area\nStatus: Under Construction (RERA Approved)\nAmenities: Landscaped Garden, Gymnasium, Swimming Pool, Banquet Hall, Indoor Games, Children's Play Area\nSource: https://prycoons.com/3-bhk-flats-in-science-city-ahmedabad/`,
    metadata: {
      projectName: 'Aahvan Greens',
      developer: 'Aahvan Group',
      location: 'Science City',
      city: 'Ahmedabad',
      propertyType: '3BHK',
      bhk: '3 BHK',
      price: '₹1.65 crore Onwards',
      priceNum: 165,
      carpetArea: '2448–3150 Sq Ft',
      sourceUrl: 'https://prycoons.com/3-bhk-flats-in-science-city-ahmedabad/',
      image: 'https://prycoons.com/wp-content/uploads/2025/09/Aahvan-Greens_5-584x438.webp',
      amenities: ['Landscaped Garden', 'Gymnasium', 'Swimming Pool', 'Banquet Hall'],
    },
    chunkIndex: 0,
  });

  // --------------------------------------------------------------------------
  // TEST 1: Short First Message After Name Collection
  // --------------------------------------------------------------------------
  console.log('\n[Test 1] Short First Message After Name Collection');
  const greetingSession = await sessionRepository.createSession({
    projectId,
    sessionMetadata: { state: 'GREETING', stepIndex: 0, discovery: {}, lead: {} },
  });

  const startTimeGreeting = Date.now();
  const nameResponse = await conversationService.processMessage({
    projectId,
    sessionId: greetingSession.id,
    message: 'I am Rahul',
  });
  const greetingDuration = Date.now() - startTimeGreeting;

  console.log(`  Response text: "${nameResponse.message}"`);
  console.log(`  Latency: ${greetingDuration}ms`);

  assert(nameResponse.message.includes('Nice to meet you, Rahul!'), 'Greeting uses user name naturally');
  assert(nameResponse.message.includes('buy, rent, or just exploring'), 'Contains the preferred natural question');
  assert(!nameResponse.message.toLowerCase().includes('sunny'), 'Does NOT force weather into greeting');
  assert(!nameResponse.message.toLowerCase().includes("it's good evening!"), 'Does NOT contain awkward time phrases');
  assert(nameResponse.message.split('\n').filter(Boolean).length <= 2, 'Message is concise (1-2 sentences)');
  assert(nameResponse.suggestions.includes('Looking to Buy 🏡'), 'Provides relevant buying quick reply');
  assert(greetingDuration < 350, `Greeting response is fast without unnecessary RAG (${greetingDuration}ms)`);

  // --------------------------------------------------------------------------
  // TEST 2: Location and Time Context
  // --------------------------------------------------------------------------
  console.log('\n[Test 2] Clean Time of Day & No Invented Weather');
  const morningCtx = locationService.getTimeContext(8);
  const afternoonCtx = locationService.getTimeContext(14);
  const eveningCtx = locationService.getTimeContext(19);

  assert(morningCtx.greeting === 'Good morning', 'Morning greeting has no embedded exclamation mark');
  assert(afternoonCtx.greeting === 'Good afternoon', 'Afternoon greeting is clean');
  assert(eveningCtx.greeting === 'Good evening', 'Evening greeting is clean');

  const locCtx = locationService.getLocationFromRequest();
  assert(!locCtx.weatherSummary, 'Default location service does not invent weather without configured provider');

  // --------------------------------------------------------------------------
  // TEST 3: Property Retrieval With Real Website Prices & Images
  // --------------------------------------------------------------------------
  console.log('\n[Test 3] Property Retrieval & Presentation for Science City (Aahvan Greens)');
  const chunks = await retrievalService.hybridRetrieve(projectId, 'Show me 3BHK flats in Science City');
  assert(chunks.length > 0, 'Retrieves Science City chunks');

  const matchResult = propertyMatcherService.matchProperties(chunks, {
    location: 'Science City',
    propertyType: '3BHK',
  });

  assert(matchResult.exactMatch !== null, 'Found matching property card');
  assert(matchResult.exactMatch?.title === 'Aahvan Greens', 'Matched project is Aahvan Greens');
  assert(matchResult.exactMatch?.priceRange === '₹1.65 crore Onwards', 'Retrieved exact website price');
  assert(matchResult.exactMatch?.priceNum === 165, 'PriceNum parsed correctly as 165 Lakhs');
  assert(
    matchResult.exactMatch?.image === 'https://prycoons.com/wp-content/uploads/2025/09/Aahvan-Greens_5-584x438.webp',
    'Uses real indexed website image URL'
  );
  assert(
    !matchResult.exactMatch?.image?.includes('unsplash.com'),
    'Never uses fake Unsplash stock photos'
  );
  assert(matchResult.exactMatch?.amenities?.length! > 0, 'Retrieves actual project amenities');
  assert(matchResult.allMatches.length > 0, 'Provides allMatches array for multi-card rendering');

  // --------------------------------------------------------------------------
  // TEST 4: Budget Filtering
  // --------------------------------------------------------------------------
  console.log('\n[Test 4] Budget Filtering Under ₹1 Crore');
  // Seed Ananta at 92 Lakhs in Gota
  await knowledgeRepository.createChunk({
    id: 'test-chk-ananta-budget',
    documentId: docScienceCity.id,
    projectId,
    content: `Project: Ananta\nDeveloper: Dharti Saket\nLocation: Gota, Ahmedabad\nConfiguration: 3 BHK\nPrice: ₹92 lakh Onwards\nArea: 1863 - 2079 Sq Ft\nSource: https://prycoons.com/3-bhk-flats-in-gota-ahmedabad/`,
    metadata: {
      projectName: 'Ananta',
      location: 'Gota',
      propertyType: '3BHK',
      bhk: '3 BHK',
      price: '₹92 lakh Onwards',
      priceNum: 92,
      carpetArea: '1863 - 2079 Sq Ft',
      sourceUrl: 'https://prycoons.com/3-bhk-flats-in-gota-ahmedabad/',
    },
    chunkIndex: 1,
  });

  const budgetChunks = await retrievalService.hybridRetrieve(projectId, '3 BHK in Gota or Science City under 1 crore');
  const budgetMatch = propertyMatcherService.matchProperties(budgetChunks, {
    budgetNum: 100,
  });

  assert(budgetMatch.exactMatch !== null, 'Found matching property for budget');
  assert(budgetMatch.exactMatch?.priceNum! <= 100, 'Matched property is within the ₹1 Crore budget');
  assert(budgetMatch.exactMatch?.title === 'Ananta', 'Prioritizes Ananta at ₹92 Lakh over ₹1.65 Crore Aahvan Greens');

  // --------------------------------------------------------------------------
  // TEST 5: Retrieval Caching for Speed
  // --------------------------------------------------------------------------
  console.log('\n[Test 5] Retrieval Caching Performance');
  const t1 = Date.now();
  await retrievalService.hybridRetrieve(projectId, '3BHK homes in Science City');
  const durationFirst = Date.now() - t1;

  const t2 = Date.now();
  const cachedChunks = await retrievalService.hybridRetrieve(projectId, '3BHK homes in Science City');
  const durationCached = Date.now() - t2;

  console.log(`  First query: ${durationFirst}ms | Cached query: ${durationCached}ms`);
  assert(cachedChunks.length > 0, 'Cached retrieval returns valid results');
  assert(durationCached <= durationFirst, 'Cached query is faster than initial query');

  // --------------------------------------------------------------------------
  // TEST 6: Real Houzez HTML Crawler Extraction
  // --------------------------------------------------------------------------
  console.log('\n[Test 6] Crawler DOM Extraction from Live Houzez Theme HTML');
  const mockHouzezHtml = `
    <!DOCTYPE html>
    <html>
      <head><title>Gota Properties - Prycoons</title></head>
      <body>
        <div class="item-wrap" data-listid="1234">
          <div class="item-thumb">
            <img class="houzez-lazyload" data-src="https://prycoons.com/wp-content/uploads/2025/09/Aahvan-Greens_5-584x438.webp" src="data:image/svg+xml..." alt="Aahvan Greens" />
          </div>
          <div class="item-body">
            <h2 class="item-title"><a href="https://prycoons.com/properties/aahvan-greens/">Aahvan Greens</a></h2>
            <div class="item-price-wrap"><span class="price">₹1.65 crore Onwards</span></div>
            <address class="item-address">Science City, Ahmedabad, Gujarat</address>
            <ul class="item-amenities">
              <li class="h-beds"><i class="houzez-icon"></i>3 BHK</li>
              <li class="h-area"><i class="houzez-icon"></i>2448–3150 Sq Ft</li>
            </ul>
            <span class="label-status">Under Construction (RERA Approved)</span>
          </div>
        </div>
      </body>
    </html>
  `;

  const parsedPage = crawlerService.parseHtmlContent('https://prycoons.com/properties/', mockHouzezHtml);
  assert(parsedPage.metadata.properties !== undefined, 'Crawler extracts structured properties array');
  assert(parsedPage.metadata.properties!.length === 1, 'Extracted 1 structured property from DOM');

  const prop = parsedPage.metadata.properties![0];
  assert(prop.projectName === 'Aahvan Greens', 'Extracted property title accurately');
  assert(prop.price === '₹1.65 crore Onwards', 'Extracted exact visible price');
  assert(prop.priceNum === 165, 'Normalized price into numerical Lakhs (165)');
  assert(prop.image === 'https://prycoons.com/wp-content/uploads/2025/09/Aahvan-Greens_5-584x438.webp', 'Extracted real image URL from data-src');
  assert(prop.bhk === '3 BHK', 'Extracted BHK configuration');
  assert(prop.carpetArea === '2448–3150 Sq Ft', 'Extracted carpet area');
  assert(prop.location === 'Science City', 'Extracted exact locality Science City');

  // --------------------------------------------------------------------------
  // TEST 7: Location Sharing via Chat
  // --------------------------------------------------------------------------
  console.log('\n[Test 7] Geolocation Sharing via Chat Message');
  const locSession = await sessionRepository.createSession({
    projectId,
    sessionMetadata: { state: 'GREETING', stepIndex: 0, discovery: {}, lead: {} },
  });

  const locResponse = await conversationService.processMessage({
    projectId,
    sessionId: locSession.id,
    message: 'LOCATION_SHARED: Science City',
  });

  assert(locResponse.message.includes('Science City'), 'Acknowledges shared location');
  assert(locResponse.context.userLocation === 'Science City', 'Stores resolved user location in session');
  assert(locResponse.context.discovery.location === 'Science City', 'Updates discovery location for property search');

  console.log('\n=======================================================');
  console.log('🎉 ALL BRIM CHATBOT IMPROVEMENT REGRESSION TESTS PASSED!');
  console.log('=======================================================\n');
}

runChatImprovementsTests().catch((err) => {
  console.error(`\n❌ Tests Failed: ${err.message}\n${err.stack}`);
  process.exit(1);
});
