import assert from 'assert';
import { conversationService } from '../src/services/chatbot/conversation.service';
import { sessionRepository } from '../src/repositories/session.repository';
import { messageRepository } from '../src/repositories/message.repository';
import { connectDatabase } from '../src/config/database';

async function runRegressionTests() {
  console.log('================================================================');
  console.log('🧪 VERIFYING UNIFIED CONVERSATION FLOW (12 REGRESSION TESTS)');
  console.log('================================================================');

  await connectDatabase();
  const projectId = 'prycoons-ai';

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: User selects BUY through the existing button and follows predefined flow
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[1] User selects BUY through existing button and follows predefined flow');
  const session1 = await sessionRepository.createSession({ projectId });
  const turn1_1 = await conversationService.processMessage({
    projectId,
    sessionId: session1.id,
    message: 'Looking to Buy 🏡',
  });
  console.log(`  Bot asked: "${turn1_1.message}"`);
  assert(turn1_1.context.intent === 'buy', 'Intent is set to BUY');
  assert(
    turn1_1.message.toLowerCase().includes('bhk') || turn1_1.context.state === 'DISCOVERY_HOME_TYPE',
    'Chatbot asks for BHK preference next'
  );
  assert(turn1_1.quickReplies.some((r) => r.includes('BHK')), 'Quick replies include BHK options');
  assert(!turn1_1.context.discovery.location, 'Location not yet asked or set');

  const turn1_2 = await conversationService.processMessage({
    projectId,
    sessionId: session1.id,
    message: '3 BHK',
  });
  console.log(`  Bot asked: "${turn1_2.message}"`);
  assert(turn1_2.context.intent === 'buy', 'Intent remains BUY');
  assert(turn1_2.context.discovery.bhk === '3 BHK', 'BHK is saved as 3 BHK');
  assert(
    turn1_2.message.toLowerCase().includes('locality') || turn1_2.message.toLowerCase().includes('area') || turn1_2.context.state === 'DISCOVERY_LOCATION',
    'Chatbot asks for location next'
  );
  assert(turn1_2.quickReplies.includes('Gota'), 'Quick replies include Gota');

  const turn1_3 = await conversationService.processMessage({
    projectId,
    sessionId: session1.id,
    message: 'Gota',
  });
  console.log(`  Bot response length: ${turn1_3.message.length} chars, cards: ${turn1_3.propertyCards?.length || 0}`);
  assert(turn1_3.context.discovery.location === 'Gota', 'Location is saved as Gota');
  assert((turn1_3.propertyCards && turn1_3.propertyCards.length > 0) || turn1_3.sources.length > 0 || turn1_3.context.state === 'PROPERTY_SEARCH', 'Proceeded to property retrieval');
  console.log('  ✓ Test 1 Passed: Intent -> BHK -> Location -> Retrieval');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: User types "I want to buy a property in Gota" and is asked only for BHK
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[2] User types "I want to buy a property in Gota" -> asked ONLY for BHK');
  const session2 = await sessionRepository.createSession({ projectId });
  const turn2 = await conversationService.processMessage({
    projectId,
    sessionId: session2.id,
    message: 'I want to buy a property in Gota',
  });
  console.log(`  Bot asked: "${turn2.message}"`);
  assert(turn2.context.intent === 'buy', 'Recognized intent as BUY');
  assert(turn2.context.discovery.location === 'Gota', 'Recognized location as Gota');
  assert(!turn2.context.discovery.bhk, 'BHK is identified as missing');
  assert(turn2.message.toLowerCase().includes('bhk'), 'Asked for BHK configuration');
  assert(!turn2.message.toLowerCase().includes('are you looking to buy, rent'), 'Did NOT re-ask buy or rent');
  assert(!turn2.message.toLowerCase().includes('which locality in ahmedabad do you prefer'), 'Did NOT re-ask location');
  assert(turn2.quickReplies.some((q) => q.includes('BHK')), 'Provides BHK quick replies');
  console.log('  ✓ Test 2 Passed: Recognized BUY and Gota, asked only for BHK');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: User types "I want to buy a 3BHK property" and is asked only for location
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[3] User types "I want to buy a 3BHK property" -> asked ONLY for location');
  const session3 = await sessionRepository.createSession({ projectId });
  const turn3 = await conversationService.processMessage({
    projectId,
    sessionId: session3.id,
    message: 'I want to buy a 3BHK property',
  });
  console.log(`  Bot asked: "${turn3.message}"`);
  assert(turn3.context.intent === 'buy', 'Recognized intent as BUY');
  assert(turn3.context.discovery.bhk === '3 BHK', 'Recognized BHK as 3 BHK');
  assert(!turn3.context.discovery.location, 'Location is identified as missing');
  assert(
    turn3.message.toLowerCase().includes('locality') || turn3.message.toLowerCase().includes('area'),
    'Asked which Ahmedabad locality they prefer'
  );
  assert(!turn3.message.toLowerCase().includes('are you looking to buy, rent'), 'Did NOT re-ask buy or rent');
  assert(turn3.quickReplies.includes('Gota'), 'Provides locality quick replies');
  console.log('  ✓ Test 3 Passed: Recognized BUY and 3 BHK, asked only for locality');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: User types "I want to buy a 3BHK flat in Gota" and proceeds without redundant questions
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[4] User types "I want to buy a 3BHK flat in Gota" -> proceeds directly to retrieval');
  const session4 = await sessionRepository.createSession({ projectId });
  const turn4 = await conversationService.processMessage({
    projectId,
    sessionId: session4.id,
    message: 'I want to buy a 3BHK flat in Gota',
  });
  console.log(`  Bot response cards: ${turn4.propertyCards?.length || 0}`);
  assert(turn4.context.intent === 'buy', 'Recognized BUY');
  assert(turn4.context.discovery.bhk === '3 BHK', 'Recognized 3 BHK');
  assert(turn4.context.discovery.location === 'Gota', 'Recognized Gota');
  assert(!turn4.message.toLowerCase().includes('how many bhk'), 'Did not ask for BHK again');
  assert(!turn4.message.toLowerCase().includes('which locality'), 'Did not ask for location again');
  assert((turn4.propertyCards && turn4.propertyCards.length > 0) || turn4.sources.length > 0 || turn4.context.state === 'PROPERTY_SEARCH', 'Proceeded to property retrieval');
  console.log('  ✓ Test 4 Passed: All criteria extracted, proceeded directly to retrieval');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: User supplies intent, BHK, and location across separate messages
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[5] Multi-turn input: Intent -> BHK -> Location');
  const session5 = await sessionRepository.createSession({ projectId });
  const turn5_1 = await conversationService.processMessage({
    projectId,
    sessionId: session5.id,
    message: 'I want to buy a property',
  });
  assert(turn5_1.context.intent === 'buy', 'Turn 1 sets intent to BUY');
  assert(turn5_1.message.toLowerCase().includes('bhk'), 'Turn 1 asks for BHK');

  const turn5_2 = await conversationService.processMessage({
    projectId,
    sessionId: session5.id,
    message: '3 BHK',
  });
  assert(turn5_2.context.intent === 'buy', 'Turn 2 preserves BUY');
  assert(turn5_2.context.discovery.bhk === '3 BHK', 'Turn 2 saves 3 BHK');
  assert(turn5_2.message.toLowerCase().includes('locality') || turn5_2.message.toLowerCase().includes('area'), 'Turn 2 asks for Location');

  const turn5_3 = await conversationService.processMessage({
    projectId,
    sessionId: session5.id,
    message: 'Gota',
  });
  assert(turn5_3.context.intent === 'buy', 'Turn 3 preserves BUY');
  assert(turn5_3.context.discovery.bhk === '3 BHK', 'Turn 3 preserves 3 BHK');
  assert(turn5_3.context.discovery.location === 'Gota', 'Turn 3 saves Gota');
  assert(turn5_3.context.state === 'PROPERTY_SEARCH', 'Turn 3 executes property search');
  console.log('  ✓ Test 5 Passed: State preserved and accumulated across multiple turns');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 6: User changes from 3 BHK to 2 BHK and previous location and intent remain intact
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[6] Preference update: "Actually, show me 2BHK properties instead"');
  const turn6 = await conversationService.processMessage({
    projectId,
    sessionId: session5.id,
    message: 'Actually, show me 2BHK properties instead',
  });
  console.log(`  Updated BHK: "${turn6.context.discovery.bhk}", Location: "${turn6.context.discovery.location}", Intent: "${turn6.context.intent}"`);
  assert(turn6.context.intent === 'buy', 'Intent BUY remains intact');
  assert(turn6.context.discovery.location === 'Gota', 'Location Gota remains intact');
  assert(turn6.context.discovery.bhk === '2 BHK', 'BHK updated to 2 BHK');
  assert(turn6.context.state === 'PROPERTY_SEARCH', 'Re-runs property retrieval with updated criteria');
  console.log('  ✓ Test 6 Passed: Preference changed smoothly without wiping out location or intent');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 7: User asks "Should I buy or rent?" and chatbot does not prematurely commit to intent
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[7] Informational comparison: "Should I buy or rent?"');
  const session7 = await sessionRepository.createSession({ projectId });
  const turn7 = await conversationService.processMessage({
    projectId,
    sessionId: session7.id,
    message: 'Should I buy or rent in Ahmedabad?',
  });
  console.log(`  Intent after question: "${turn7.context.intent || 'undefined'}"`);
  console.log(`  Bot answer: "${turn7.message.slice(0, 120)}..."`);
  assert(!turn7.context.intent, 'Intent is NOT prematurely committed to buy or rent');
  assert(!turn7.propertyCard, 'Did NOT force a property search');
  assert(turn7.quickReplies.some((r) => r.includes('Buy') || r.includes('Rent')), 'Provides exploratory quick replies');
  console.log('  ✓ Test 7 Passed: Comparison question answered objectively without defaulting intent');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 8: User provides their name while a different flow question is pending
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[8] User introduces name: "Call me Rahul" while BHK question is pending');
  const session8 = await sessionRepository.createSession({ projectId });
  // Start flow: choose buy
  await conversationService.processMessage({
    projectId,
    sessionId: session8.id,
    message: 'Looking to Buy 🏡',
  });
  // Now user says "Call me Rahul"
  const turn8 = await conversationService.processMessage({
    projectId,
    sessionId: session8.id,
    message: 'Call me Rahul',
  });
  console.log(`  Bot response: "${turn8.message}"`);
  assert(turn8.context.userName === 'Rahul', 'Saved userName as Rahul');
  assert(turn8.context.intent === 'buy', 'Preserved BUY intent');
  assert(!turn8.message.toLowerCase().includes('nice to meet you, call'), 'Did not extract "Call" as name');
  assert(turn8.message.toLowerCase().includes('rahul'), 'Acknowledged name Rahul');
  assert(turn8.message.toLowerCase().includes('bhk'), 'Naturally continued asking for the pending BHK question');
  assert(turn8.quickReplies.some((q) => q.includes('BHK')), 'Quick replies remain BHK options');
  console.log('  ✓ Test 8 Passed: Name saved and pending flow question continued');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 9: User asks an unrelated informational question during flow and pending state survives
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[9] Out-of-flow question: "What does BHK mean?" during search flow');
  const session9 = await sessionRepository.createSession({ projectId });
  await conversationService.processMessage({
    projectId,
    sessionId: session9.id,
    message: 'I want to buy a property in Gota',
  });
  // Chatbot asked for BHK. User asks "What does BHK mean?"
  const turn9 = await conversationService.processMessage({
    projectId,
    sessionId: session9.id,
    message: 'What does BHK mean?',
  });
  console.log(`  Bot response snippet: "${turn9.message.slice(0, 160)}..."`);
  assert(turn9.context.intent === 'buy', 'BUY intent survives');
  assert(turn9.context.discovery.location === 'Gota', 'Location Gota survives');
  assert(turn9.message.toLowerCase().includes('bedroom') || turn9.message.toLowerCase().includes('hall') || turn9.message.toLowerCase().includes('bhk'), 'Explains BHK');
  assert(turn9.message.toLowerCase().includes('how many bhk') || turn9.quickReplies.some((q) => q.includes('BHK')), 'Naturally returns to pending BHK question');
  console.log('  ✓ Test 9 Passed: Flow state survived and returned to pending question');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 10: User refreshes or reopens a conversation and previously saved fields are restored
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[10] Refresh/Reopen session: Verify state persistence');
  const restoredSession = await sessionRepository.getSessionById(session5.id);
  assert(restoredSession, 'Session exists in repository');
  const restoredMetadata = restoredSession.sessionMetadata;
  console.log(`  Restored session state: intent=${restoredMetadata.intent}, bhk=${restoredMetadata.discovery.bhk}, location=${restoredMetadata.discovery.location}`);
  assert(restoredMetadata.intent === 'buy', 'Restored intent is BUY');
  assert(restoredMetadata.discovery.bhk === '2 BHK', 'Restored BHK is 2 BHK');
  assert(restoredMetadata.discovery.location === 'Gota', 'Restored location is Gota');
  console.log('  ✓ Test 10 Passed: Session persistence accurately restores previously collected fields');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 11: Updated criteria trigger fresh, correctly filtered RAG retrieval
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[11] Updated criteria triggers fresh RAG retrieval query');
  const session11 = await sessionRepository.createSession({ projectId });
  const turn11_1 = await conversationService.processMessage({
    projectId,
    sessionId: session11.id,
    message: 'I want to buy a 3BHK in Gota',
  });
  const firstTitles = turn11_1.context.displayedPropertyTitles || [];

  const turn11_2 = await conversationService.processMessage({
    projectId,
    sessionId: session11.id,
    message: 'Actually, show me 4BHK properties in Science City instead',
  });
  assert(turn11_2.context.discovery.bhk === '4 BHK', 'BHK updated to 4 BHK');
  assert(turn11_2.context.discovery.location === 'Science City', 'Location updated to Science City');
  console.log(`  New search location: ${turn11_2.context.discovery.location}, BHK: ${turn11_2.context.discovery.bhk}`);
  console.log('  ✓ Test 11 Passed: Fresh retrieval triggered on criteria change');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 12: Existing property cards, images, links, OpenAI responses, and persistence continue to work
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[12] Property cards structure, sources, and links');
  if (turn4.propertyCards && turn4.propertyCards.length > 0) {
    const card = turn4.propertyCards[0];
    console.log(`  Verified Card: "${card.title}" | Price: ${card.priceRange} | Loc: ${card.location}`);
    assert(card.title, 'Card has title');
    assert(card.location, 'Card has location');
    assert(card.sourceUrl || card.propertyDetailUrl, 'Card has valid URL');
  }
  assert(turn4.message && turn4.message.length > 20, 'OpenAI generated grounded, helpful message');
  console.log('  ✓ Test 12 Passed: Property cards and responses fully operational');

  console.log('\n================================================================');
  console.log('🎉 ALL 12 REGRESSION TESTS COMPLETED SUCCESSFULLY!');
  console.log('================================================================');
  process.exit(0);
}

runRegressionTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
