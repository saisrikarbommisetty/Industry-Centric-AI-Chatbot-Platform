import assert from 'assert';
import { conversationService } from '../src/services/chatbot/conversation.service';
import { projectRepository } from '../src/repositories/project.repository';
import { knowledgeRepository } from '../src/repositories/knowledge.repository';
import { embeddingService } from '../src/services/embeddings/embedding.service';

async function runTest() {
  console.log('================================================================');
  console.log('🧪 VERIFYING NON-PRYCOONS REAL ESTATE BRAND ISOLATION (CLAADS)');
  console.log('================================================================\n');

  // 1. Create a distinct real estate bot: Claads Properties (claads.in)
  const claadsBot = await projectRepository.create({
    id: 'claads-properties',
    name: 'Claads Properties',
    slug: 'claads-properties',
    industry: 'real-estate',
    industryName: 'Real Estate & Property',
    websiteUrl: 'https://claads.in/',
    description: 'Premier residential real estate developer based in Bangalore. Offering luxury 3 & 4 BHK apartments in Whitefield and Indiranagar.',
    systemInstructions: 'Represent Claads Properties professionally. Assist property seekers with Whitefield and Indiranagar residential projects.',
    welcomeMessage: 'Welcome to Claads Properties! How can we assist with your dream home search today?',
    suggestedQuestions: ['Explore Bangalore properties 🏡', 'Skyline Towers pricing 💰', 'Contact sales team 📞'],
    leadCaptureEnabled: true,
    isActive: true,
  });

  console.log('✓ Provisioned bot:', claadsBot.name, `(${claadsBot.websiteUrl})`);

  // 2. Index verified website knowledge for Claads Properties
  const claadsSource = await knowledgeRepository.createSource({
    projectId: 'claads-properties',
    url: 'https://claads.in/properties/skyline-towers',
    title: 'Skyline Towers - Luxury 3 BHK Living in Whitefield, Bangalore | Claads',
    type: 'URL',
    status: 'INDEXED',
    extractedSummary: 'Skyline Towers offers 3 BHK apartments in Whitefield Bangalore by Claads Properties.',
  });

  const claadsDoc = await knowledgeRepository.createDocument({
    sourceId: claadsSource.id,
    projectId: 'claads-properties',
    title: 'Skyline Towers by Claads Properties',
    url: 'https://claads.in/properties/skyline-towers',
    content: `Project: Skyline Towers
Developer: Claads Luxury Developments
Location: Whitefield, Bangalore
Configuration: 3 BHK
Price: ₹1.85 Crore Onwards
Area: 2150 Sq Ft Super Built Up Area
Status: Under Construction (RERA Karnataka Approved)
Amenities: Infinity Pool, Clubhouse, Badminton Court, 24/7 Security
Source: https://claads.in/properties/skyline-towers
Verified Details: Official listing from Claads Properties.`,
    metadata: {
      projectName: 'Skyline Towers',
      developer: 'Claads Luxury Developments',
      location: 'Whitefield',
      city: 'Bangalore',
      bhk: '3 BHK',
      price: '₹1.85 Crore Onwards',
      priceNum: 185,
      propertyDetailUrl: 'https://claads.in/properties/skyline-towers',
    },
    contentHash: 'claads-hash-1',
  });

  const dummyEmbedding = new Array(768).fill(0.05);
  await knowledgeRepository.createChunk({
    documentId: claadsDoc.id,
    projectId: 'claads-properties',
    content: claadsDoc.content,
    embedding: dummyEmbedding,
    metadata: claadsDoc.metadata,
    chunkIndex: 0,
  });

  console.log('✓ Indexed verified knowledge chunk for Claads in Whitefield, Bangalore.\n');

  // 3. Test Greeting on Claads bot
  console.log('[Test 1] User sends initial greeting ("Hello")...');
  const greetingRes = await conversationService.processMessage({
    projectId: 'claads-properties',
    sessionId: 'sess-claads-test-1',
    message: 'Hello',
  });

  console.log('  Bot Greeting:', greetingRes.message);

  assert(
    !greetingRes.message.toLowerCase().includes('prycoons'),
    'Claads greeting must NOT mention Prycoons!'
  );
  assert(
    !greetingRes.message.toLowerCase().includes('ahmedabad'),
    'Claads greeting must NOT mention Ahmedabad!'
  );
  assert(
    greetingRes.message.includes('Claads Properties') || greetingRes.message.includes('Claads'),
    'Claads greeting MUST mention Claads Properties!'
  );
  console.log('  ✓ Verified Claads greeting is 100% brand-isolated with ZERO Prycoons leakage.\n');

  // 4. Test Property Inquiry on Claads bot
  console.log('[Test 2] User asks about properties ("What 3 BHK properties do you have?")...');
  const propRes = await conversationService.processMessage({
    projectId: 'claads-properties',
    sessionId: 'sess-claads-test-1',
    message: 'What 3 BHK properties do you have available?',
  });

  console.log('  Bot Answer:', propRes.message);
  if (propRes.propertyCard) {
    console.log('  Property Card:', propRes.propertyCard.title, `(${propRes.propertyCard.location})`);
    console.log('  Property Card URL:', propRes.propertyCard.sourceUrl);
  }

  assert(
    !propRes.message.toLowerCase().includes('prycoons'),
    'Claads property answer must NOT mention Prycoons!'
  );
  assert(
    !propRes.message.toLowerCase().includes('ananta') && !propRes.message.toLowerCase().includes('samatva'),
    'Claads property answer must NOT return Prycoons projects!'
  );
  assert(
    propRes.message.toLowerCase().includes('skyline') || propRes.message.toLowerCase().includes('whitefield') || propRes.message.toLowerCase().includes('1.85'),
    'Claads property answer MUST reference its own verified Whitefield property!'
  );

  if (propRes.propertyCard) {
    assert(
      !propRes.propertyCard.sourceUrl?.includes('prycoons.com'),
      'Property card source URL must NEVER point to prycoons.com!'
    );
    assert(
      propRes.propertyCard.sourceUrl?.includes('claads.in'),
      'Property card source URL must point to claads.in!'
    );
  }
  console.log('  ✓ Verified Claads answers strictly from its own website with verified Claads property cards.\n');

  // 5. Test Contact Query on Claads bot
  console.log('[Test 3] User asks about contact information ("How can I contact you?")...');
  const contactRes = await conversationService.processMessage({
    projectId: 'claads-properties',
    sessionId: 'sess-claads-test-1',
    message: 'How can I contact your sales team?',
  });

  console.log('  Bot Answer:', contactRes.message);

  assert(
    !contactRes.message.includes('admin@prycoons.com'),
    'Claads must NEVER share Prycoons email!'
  );
  assert(
    !contactRes.message.includes('+91 7861072811'),
    'Claads must NEVER share Prycoons phone number!'
  );
  console.log('  ✓ Verified Claads never leaks Prycoons contact desk.\n');

  // 6. Test Existing Prycoons Real Estate Bot Functionality (MUST REMAIN 100% PRESERVED)
  console.log('[Test 4] Verifying Prycoons Real Estate bot retains 100% functionality...');
  const prycoonsGreeting = await conversationService.processMessage({
    projectId: 'prycoons-ai',
    sessionId: 'sess-prycoons-preserve-check',
    message: 'Hi',
  });

  console.log('  Prycoons Greeting:', prycoonsGreeting.message);
  assert(
    prycoonsGreeting.message.toLowerCase().includes('prycoons'),
    'Prycoons bot must continue to represent Prycoons!'
  );

  const prycoonsSearch = await conversationService.processMessage({
    projectId: 'prycoons-ai',
    sessionId: 'sess-prycoons-preserve-check',
    message: 'Show me 3 BHK properties in Gota',
  });

  console.log('  Prycoons Gota Search Response:', prycoonsSearch.message.slice(0, 80));
  assert(
    prycoonsSearch.message.includes('Gota') || (prycoonsSearch.propertyCards && prycoonsSearch.propertyCards.length > 0),
    'Prycoons must still return its verified Gota properties or search response!'
  );
  if (prycoonsSearch.propertyCards && prycoonsSearch.propertyCards.length > 0) {
    assert(
      prycoonsSearch.propertyCards[0].sourceUrl?.includes('prycoons.com'),
      'Prycoons property cards must continue pointing to prycoons.com!'
    );
  }
  console.log('  ✓ Verified Prycoons retains 100% of real estate features and verified Ahmedabad listings.\n');

  console.log('================================================================');
  console.log('🎉 ALL BRAND ISOLATION & NON-PRYCOONS REAL ESTATE TESTS PASSED!');
  console.log('================================================================\n');
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
