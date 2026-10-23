import { retrievalService } from '../src/services/rag/retrieval.service';
import { propertyMatcherService } from '../src/services/rag/propertyMatcher.service';
import { knowledgeRepository } from '../src/repositories/knowledge.repository';

// Simple test assertion helper
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function setupTestData() {
  const projectId = 'prycoons-ai';

  // Seed Ananta & Satyamev in Gota
  const srcGota = await knowledgeRepository.createSource({
    id: 'test-src-gota',
    projectId,
    url: 'https://prycoons.com/3-bhk-flats-in-gota-ahmedabad/',
    title: '3 BHK Flats in Gota Ahmedabad',
    status: 'INDEXED',
  });

  const docGota = await knowledgeRepository.createDocument({
    id: 'test-doc-gota',
    sourceId: srcGota.id,
    projectId,
    title: '3 BHK Flats in Gota Ahmedabad',
    url: 'https://prycoons.com/3-bhk-flats-in-gota-ahmedabad/',
    content: 'Ananta (by Dharti Saket) – 3 BHK Gota, Ahmedabad, 1863 - 2079 Sq Ft, ₹92 lakh Onwards. Amenities: Landscaped Garden, Gymnasium, Children Play Area, EV Parking.',
    contentHash: 'hash-test-gota',
  });

  await knowledgeRepository.createChunk({
    id: 'test-chk-ananta',
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
      amenities: ['Landscaped Garden', 'Gymnasium', 'Children Play Area', 'EV Parking'],
      sourceUrl: 'https://prycoons.com/3-bhk-flats-in-gota-ahmedabad/',
    },
    chunkIndex: 0,
  });

  // Seed Shyam Heights in Tragad
  const srcTragad = await knowledgeRepository.createSource({
    id: 'test-src-tragad',
    projectId,
    url: 'https://prycoons.com/3-bhk-flats-in-tragad-ahmedabad/',
    title: '3 BHK Flats in Tragad Ahmedabad',
    status: 'INDEXED',
  });

  const docTragad = await knowledgeRepository.createDocument({
    id: 'test-doc-tragad',
    sourceId: srcTragad.id,
    projectId,
    title: '3 BHK Flats in Tragad Ahmedabad',
    url: 'https://prycoons.com/3-bhk-flats-in-tragad-ahmedabad/',
    content: 'Shyam Heights 1 – 2 & 3 BHK Tragad, Ahmedabad, 1539 - 2007 Sq Ft, ₹68 lakh Onwards.',
    contentHash: 'hash-test-tragad',
  });

  await knowledgeRepository.createChunk({
    id: 'test-chk-shyam',
    documentId: docTragad.id,
    projectId,
    content: `Project: Shyam Heights 1\nDeveloper: Shyam Developers\nLocation: Tragad, Ahmedabad\nConfiguration: 2 & 3 BHK\nPrice: ₹68 lakh Onwards\nArea: 1539 - 2007 Sq Ft Super Built Up Area\nStatus: Under Construction (RERA Approved)\nSource: https://prycoons.com/3-bhk-flats-in-tragad-ahmedabad/`,
    metadata: {
      projectName: 'Shyam Heights 1',
      developer: 'Shyam Developers',
      location: 'Tragad',
      propertyType: '3BHK',
      price: '₹68 lakh Onwards',
      priceNum: 68,
      sourceUrl: 'https://prycoons.com/3-bhk-flats-in-tragad-ahmedabad/',
    },
    chunkIndex: 0,
  });
}

async function runRagTests() {
  console.log('\n=======================================================');
  console.log('🧪 RUNNING RAG RETRIEVAL & GROUNDING TEST SUITE');
  console.log('=======================================================');

  await setupTestData();
  const projectId = 'prycoons-ai';

  // Test Case 1: What 3BHK properties are available in Gota?
  console.log('\n[Test 1] Query: "What 3BHK properties are available in Gota?"');
  const res1 = await retrievalService.hybridRetrieve(projectId, 'What 3BHK properties are available in Gota?');
  assert(res1.length > 0, 'Retrieval returns candidate chunks for Gota query');
  assert(res1[0].content.includes('Gota'), 'Top chunk matches Gota location');
  assert(res1[0].content.includes('Ananta'), 'Top chunk contains Ananta project');

  // Test Case 2: Which properties are available around ₹1 crore in Gota?
  console.log('\n[Test 2] Query: "Which properties are available around ₹1 crore in Gota?"');
  const res2 = await retrievalService.hybridRetrieve(projectId, 'Which properties are available around 1 crore in Gota?');
  assert(res2.length > 0, 'Retrieval returns results for ~1 Cr in Gota');
  const match2 = propertyMatcherService.matchProperties(res2, { location: 'Gota', budgetNum: 100 });
  assert(match2.exactMatch !== null, 'Found matching property card (Ananta at ₹92 Lakh)');
  assert(match2.exactMatch?.title === 'Ananta', 'Matched property title is Ananta');

  // Test Case 3: Tell me about Ananta in Gota
  console.log('\n[Test 3] Query: "Tell me about Ananta in Gota"');
  const res3 = await retrievalService.hybridRetrieve(projectId, 'Tell me about Ananta in Gota');
  assert(res3[0].metadata.projectName === 'Ananta', 'Project filter prioritizes Ananta');
  assert(res3[0].content.includes('₹92 lakh Onwards'), 'Contains actual website pricing');

  // Test Case 4: Which projects are in Tragad?
  console.log('\n[Test 4] Query: "Which projects are in Tragad?"');
  const res4 = await retrievalService.hybridRetrieve(projectId, 'Which projects are in Tragad?');
  assert(res4.some((c) => c.content.includes('Tragad')), 'Retrieval finds Tragad project data');
  assert(res4.some((c) => c.content.includes('Shyam Heights')), 'Found Shyam Heights in Tragad');

  // Test Case 5: Anti-hallucination verification
  console.log('\n[Test 5] Anti-hallucination check: Query unverified feature "Does Ananta have an Olympic Helipad?"');
  const res5 = await retrievalService.hybridRetrieve(projectId, 'Does Ananta have an Olympic Helipad?');
  const formatted = retrievalService.formatContextForPrompt(res5);
  assert(!formatted.toLowerCase().includes('olympic helipad'), 'Context does NOT contain nonexistent Olympic Helipad');

  console.log('\n✅ ALL RAG RETRIEVAL & GROUNDING TESTS PASSED!');
}

runRagTests().catch((err) => {
  console.error(`\n❌ RAG Tests Failed: ${err.message}`);
  process.exit(1);
});
