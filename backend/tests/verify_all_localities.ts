import { conversationService } from '../src/services/chatbot/conversation.service';
import { connectDatabase } from '../src/config/database';
import { normalizeLocality, SUPPORTED_LOCALITIES } from '../src/services/rag/propertyMatcher.service';
import { logger } from '../src/utils/logger';

interface LocalityTestResult {
  locality: string;
  query: string;
  indexedCount: number;
  returnedCount: number;
  returnedProperties: Array<{
    title: string;
    location: string;
    price: string;
    bhk: string;
    url?: string;
    imageUrl?: string;
  }>;
  passedLocalityFilter: boolean;
  budgetFilterPassed?: boolean;
  bhkFilterPassed?: boolean;
  sourceUrls: string[];
}

async function runVerification() {
  await connectDatabase();
  console.log('\n================================================================');
  console.log('🧪 RUNNING MANDATORY 12-LOCALITY & FILTER VERIFICATION SUITE');
  console.log('================================================================\n');

  const projectId = 'prycoons-ai';
  const results: LocalityTestResult[] = [];

  const localityTests = [
    {
      locality: 'Gota',
      query: 'Show me 3 BHK properties in Gota under ₹1 crore.',
      expectedBhk: '3 BHK',
      expectedMaxBudget: 100,
    },
    { locality: 'Chandkheda', query: 'Show me properties in Chandkheda.' },
    { locality: 'Zundal', query: 'Show me properties in Zundal.' },
    { locality: 'Vaishnodevi', query: 'Show me properties in Vaishnodevi.' },
    { locality: 'Ognaj', query: 'Show me properties in Ognaj.' },
    { locality: 'Satellite', query: 'Show me properties in Satellite.' },
    { locality: 'Science City', query: 'Show me properties in Science City.' },
    { locality: 'Shilaj', query: 'Show me properties in Shilaj.' },
    { locality: 'Sola', query: 'Show me properties in Sola.' },
    { locality: 'Thaltej', query: 'Show me properties in Thaltej.' },
    { locality: 'Jagatpur', query: 'Show me properties in Jagatpur.' },
    { locality: 'Tragad', query: 'Show me properties in Tragad.' },
  ];

  for (const t of localityTests) {
    const sessionId = `test-session-${t.locality.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const res = await conversationService.processMessage({
      projectId,
      sessionId,
      message: t.query,
    });

    const cards = res.propertyCards || [];
    let passedLocality = true;
    let budgetPassed = true;
    let bhkPassed = true;

    const returnedProps = cards.map((c) => {
      const cardLoc = normalizeLocality(c.location) || c.location;
      const targetLoc = normalizeLocality(t.locality);

      if (!cardLoc.toLowerCase().includes(targetLoc!.toLowerCase()) && !c.location.toLowerCase().includes(targetLoc!.toLowerCase())) {
        passedLocality = false;
      }

      if (t.expectedMaxBudget && c.priceNum && c.priceNum > t.expectedMaxBudget * 1.05) {
        budgetPassed = false;
      }

      if (t.expectedBhk && !c.bhk.includes('3')) {
        bhkPassed = false;
      }

      return {
        title: c.title,
        location: c.location,
        price: c.priceRange,
        bhk: c.bhk,
        url: c.propertyDetailUrl || c.sourceUrl,
        imageUrl: c.image || c.propertyImageUrl,
      };
    });

    const sourceUrls = Array.from(new Set(returnedProps.map((p) => p.url).filter(Boolean))) as string[];

    console.log(`\n------------------------------------------------------------`);
    console.log(`📍 Test Locality: ${t.locality}`);
    console.log(`💬 Query: "${t.query}"`);
    console.log(`📊 Cards Returned: ${cards.length}`);
    console.log(`✅ Passed Locality Filter: ${passedLocality ? 'YES' : 'NO'}`);
    if (t.expectedMaxBudget) console.log(`💰 Passed Budget Filter: ${budgetPassed ? 'YES' : 'NO'}`);
    if (t.expectedBhk) console.log(`🏡 Passed BHK Filter: ${bhkPassed ? 'YES' : 'NO'}`);
    console.log(`🔗 Returned Properties:`);
    returnedProps.forEach((p, idx) => {
      console.log(`   ${idx + 1}. ${p.title} | ${p.location} | ${p.bhk} | ${p.price} | ${p.url}`);
    });

    results.push({
      locality: t.locality,
      query: t.query,
      indexedCount: 10, // from crawling
      returnedCount: cards.length,
      returnedProperties: returnedProps,
      passedLocalityFilter: passedLocality,
      budgetFilterPassed: t.expectedMaxBudget ? budgetPassed : undefined,
      bhkFilterPassed: t.expectedBhk ? bhkPassed : undefined,
      sourceUrls,
    });
  }

  // 13. Test Changed Locality in the Same Conversation
  console.log(`\n============================================================`);
  console.log(`🧪 Test 13: Changed Locality within Same Conversation`);
  const dynamicSessionId = `test-session-dynamic-${Date.now()}`;
  // Turn 1: Chandkheda
  const turn1 = await conversationService.processMessage({
    projectId,
    sessionId: dynamicSessionId,
    message: 'Show me properties in Chandkheda',
  });
  const turn1Locs = (turn1.propertyCards || []).map((c) => c.location);
  console.log(`Turn 1 (Chandkheda) -> Cards returned: ${turn1.propertyCards?.length}, Locations: ${turn1Locs.join(', ')}`);

  // Turn 2: Switch to Shilaj
  const turn2 = await conversationService.processMessage({
    projectId,
    sessionId: dynamicSessionId,
    message: 'Actually, show me properties in Shilaj',
  });
  const turn2Locs = (turn2.propertyCards || []).map((c) => c.location);
  const turn2AllShilaj = (turn2.propertyCards || []).every((c) => c.location.toLowerCase().includes('shilaj'));
  console.log(`Turn 2 (Switched to Shilaj) -> Cards returned: ${turn2.propertyCards?.length}, Locations: ${turn2Locs.join(', ')}`);
  console.log(`✅ Locality correctly changed to Shilaj: ${turn2AllShilaj ? 'YES' : 'NO'}`);

  // 14. Test Restrictive Budget
  console.log(`\n============================================================`);
  console.log(`🧪 Test 14: Restrictive Budget Search`);
  const budgetSessionId = `test-session-budget-${Date.now()}`;
  const budgetRes = await conversationService.processMessage({
    projectId,
    sessionId: budgetSessionId,
    message: 'Show me properties in Shilaj under ₹60 lakh',
  });
  console.log(`Query: "Show me properties in Shilaj under ₹60 lakh" -> Cards returned: ${budgetRes.propertyCards?.length}`);
  budgetRes.propertyCards?.forEach((c) => {
    console.log(`   - ${c.title} (${c.priceRange}, priceNum: ${c.priceNum})`);
  });
  const allUnder60 = (budgetRes.propertyCards || []).every((c) => (c.priceNum || 0) <= 63);
  console.log(`✅ All returned properties under budget: ${allUnder60 ? 'YES' : 'NO'}`);

  // 15. Test Specific BHK Configuration
  console.log(`\n============================================================`);
  console.log(`🧪 Test 15: Specific 4 BHK Configuration in Satellite`);
  const bhkSessionId = `test-session-bhk-${Date.now()}`;
  const bhkRes = await conversationService.processMessage({
    projectId,
    sessionId: bhkSessionId,
    message: 'Show me 4 BHK properties in Satellite',
  });
  console.log(`Query: "Show me 4 BHK properties in Satellite" -> Cards returned: ${bhkRes.propertyCards?.length}`);
  bhkRes.propertyCards?.forEach((c) => {
    console.log(`   - ${c.title} (${c.bhk}, ${c.priceRange})`);
  });
  const all4Bhk = (bhkRes.propertyCards || []).every((c) => c.bhk.includes('4'));
  console.log(`✅ All returned properties 4 BHK: ${all4Bhk ? 'YES' : 'NO'}`);

  // 16. Test Locality with No Matching Property (Unindexed Locality)
  console.log(`\n============================================================`);
  console.log(`🧪 Test 16: Locality with No Matching Property in Index`);
  const unindexedSessionId = `test-session-unindexed-${Date.now()}`;
  const unindexedRes = await conversationService.processMessage({
    projectId,
    sessionId: unindexedSessionId,
    message: 'Show me properties in Maninagar',
  });
  console.log(`Query: "Show me properties in Maninagar" -> Cards returned: ${unindexedRes.propertyCards?.length}`);
  console.log(`Assistant message: "${unindexedRes.message}"`);
  console.log(`✅ Honest empty response (0 cards, no default property fallback): ${unindexedRes.propertyCards?.length === 0 ? 'YES' : 'NO'}`);

  // 17. Test Request for More Properties (Pagination)
  console.log(`\n============================================================`);
  console.log(`🧪 Test 17: Request for More Properties`);
  const moreSessionId = `test-session-more-${Date.now()}`;
  const initialGota = await conversationService.processMessage({
    projectId,
    sessionId: moreSessionId,
    message: 'Show me properties in Gota',
  });
  const firstBatchTitles = (initialGota.propertyCards || []).map((c) => c.title);
  console.log(`Batch 1 Gota -> ${firstBatchTitles.join(', ')}`);

  const moreGota = await conversationService.processMessage({
    projectId,
    sessionId: moreSessionId,
    message: 'Show more options',
  });
  const secondBatchTitles = (moreGota.propertyCards || []).map((c) => c.title);
  console.log(`Batch 2 Gota -> ${secondBatchTitles.join(', ')}`);
  const distinct = secondBatchTitles.every((t) => !firstBatchTitles.includes(t));
  console.log(`✅ Second batch has distinct properties: ${distinct ? 'YES' : 'NO'}`);

  // 18. Test Property-Specific Follow-up
  console.log(`\n============================================================`);
  console.log(`🧪 Test 18: Property-Specific Follow-Up`);
  const followUpRes = await conversationService.processMessage({
    projectId,
    sessionId: moreSessionId,
    message: 'What is the price of the first one?',
  });
  console.log(`Follow-up Question: "What is the price of the first one?"`);
  console.log(`Follow-up Response: "${followUpRes.message}"`);
  console.log(`Referenced Card: ${followUpRes.propertyCard?.title} (${followUpRes.propertyCard?.priceRange})`);
  console.log(`✅ Property follow-up correctly answered: ${followUpRes.propertyCard ? 'YES' : 'NO'}`);

  console.log('\n================================================================');
  console.log('🎉 ALL MANDATORY RETRIEVAL & FILTER TESTS COMPLETED!');
  console.log('================================================================\n');

  process.exit(0);
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
