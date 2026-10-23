import { conversationService } from '../src/services/chatbot/conversation.service';
import { sessionRepository } from '../src/repositories/session.repository';
import { knowledgeRepository } from '../src/repositories/knowledge.repository';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runContextTests() {
  console.log('\n=======================================================');
  console.log('🧪 RUNNING CONVERSATION CONTEXT & MEMORY TEST SUITE');
  console.log('=======================================================');

  const projectId = 'prycoons-ai';

  // Seed verified Gota project data
  const srcGota = await knowledgeRepository.createSource({
    id: 'test-src-gota-ctx',
    projectId,
    url: 'https://prycoons.com/3-bhk-flats-in-gota-ahmedabad/',
    title: '3 BHK Flats in Gota Ahmedabad',
    status: 'INDEXED',
  });

  const docGota = await knowledgeRepository.createDocument({
    id: 'test-doc-gota-ctx',
    sourceId: srcGota.id,
    projectId,
    title: '3 BHK Flats in Gota Ahmedabad',
    url: 'https://prycoons.com/3-bhk-flats-in-gota-ahmedabad/',
    content: 'Ananta (by Dharti Saket) – 3 BHK Gota, Ahmedabad, 1863 - 2079 Sq Ft, ₹92 lakh Onwards. Amenities: Landscaped Garden, Gymnasium, Children Play Area, EV Parking.',
    contentHash: 'hash-test-gota-ctx',
  });

  await knowledgeRepository.createChunk({
    id: 'test-chk-ananta-ctx',
    documentId: docGota.id,
    projectId,
    content: `Project: Ananta\nDeveloper: Dharti Saket\nLocation: Gota, Ahmedabad\nConfiguration: 3 BHK\nPrice: ₹92 lakh Onwards\nArea: 1863 - 2079 Sq Ft Super Built Up Area\nStatus: Under Construction (RERA Approved)\nAmenities: Landscaped Garden, Gymnasium, Children Play Area, EV Parking\nSource: https://prycoons.com/3-bhk-flats-in-gota-ahmedabad/`,
    metadata: {
      projectName: 'Ananta',
      developer: 'Dharti Saket',
      location: 'Gota',
      propertyType: '3BHK',
      price: '₹92 lakh Onwards',
      priceNum: 92,
      carpetArea: '1863 - 2079 Sq Ft',
      sourceUrl: 'https://prycoons.com/3-bhk-flats-in-gota-ahmedabad/',
    },
    chunkIndex: 0,
  });

  // Step 1: Initialize session with greeting
  console.log('\n[Step 1] User: "Hi"');
  const session = await sessionRepository.createSession({ projectId });
  const reply1 = await conversationService.processMessage({
    projectId,
    sessionId: session.id,
    message: 'Hi',
  });
  assert(reply1.message.includes('What should I call you') || reply1.message.includes('call you'), 'Bot asks for user name');

  // Step 2: User provides name "Rahul"
  console.log('\n[Step 2] User: "Rahul"');
  const reply2 = await conversationService.processMessage({
    projectId,
    sessionId: session.id,
    message: 'Rahul',
  });
  assert(reply2.context.userName === 'Rahul', 'Session memory stores userName = "Rahul"');
  assert(reply2.message.includes('Rahul'), 'Bot greets Rahul by name');

  // Step 3: User says "I'm looking for a 3BHK in Gota."
  console.log('\n[Step 3] User: "I\'m looking for a 3BHK in Gota."');
  const reply3 = await conversationService.processMessage({
    projectId,
    sessionId: session.id,
    message: "I'm looking for a 3BHK in Gota.",
  });
  assert(reply3.context.discovery.location === 'Gota', 'Session memory stores location = "Gota"');
  assert(reply3.context.discovery.homeType?.includes('3 BHK') || reply3.context.discovery.homeType?.includes('3BHK'), 'Session memory stores homeType = "3 BHK"');
  assert(reply3.context.intent === 'buy', 'Session memory stores intent = "buy"');

  // Step 4: User adds "Near a garden."
  console.log('\n[Step 4] User: "Near a garden."');
  const reply4 = await conversationService.processMessage({
    projectId,
    sessionId: session.id,
    message: 'Near a garden.',
  });
  assert(reply4.context.discovery.location === 'Gota', 'Session KEEPS location = "Gota" (not wiped)');
  assert(reply4.context.discovery.homeType?.includes('3 BHK') || reply4.context.discovery.homeType?.includes('3BHK'), 'Session KEEPS homeType = "3 BHK"');
  assert(reply4.context.discovery.nearbyPreference === 'garden' || reply4.context.discovery.mustHave?.toLowerCase().includes('garden'), 'Session stores nearbyPreference = "garden"');
  assert(!reply4.message.toLowerCase().includes('which area are you considering'), 'Bot DOES NOT re-ask for location/area');

  // Step 5: User specifies budget "Around 1 crore."
  console.log('\n[Step 5] User: "Around 1 crore."');
  const reply5 = await conversationService.processMessage({
    projectId,
    sessionId: session.id,
    message: 'Around 1 crore.',
  });
  assert(reply5.context.discovery.budgetNum === 100, 'Session memory stores budgetNum = 100 (₹1 Crore)');
  assert(reply5.context.discovery.location === 'Gota', 'Session retains location = "Gota"');
  assert(reply5.sources.length > 0, 'Retrieves verified website sources for 3BHK Gota');

  // Step 6: User provides contact "My number is +91 98250 14890"
  console.log('\n[Step 6] User: "My WhatsApp number is +91 98250 14890"');
  const reply6 = await conversationService.processMessage({
    projectId,
    sessionId: session.id,
    message: 'My WhatsApp number is +91 98250 14890',
  });
  assert(reply6.context.lead.phone === '+91 98250 14890', 'Session captures lead phone number');
  assert(reply6.context.lead.captured === true, 'Lead marked as captured');

  console.log('\n✅ ALL CONVERSATION CONTEXT & MEMORY TESTS PASSED!');
}

runContextTests().catch((err) => {
  console.error(`\n❌ Context Tests Failed: ${err.message}`);
  process.exit(1);
});
