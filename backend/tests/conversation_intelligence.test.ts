import { conversationService } from '../src/services/chatbot/conversation.service';
import { sessionRepository } from '../src/repositories/session.repository';
import { messageRepository } from '../src/repositories/message.repository';
import { connectDatabase } from '../src/config/database';
import { seedDatabase } from '../src/config/seed';
import { CANONICAL_PROPERTY_URLS } from '../src/services/rag/propertyMatcher.service';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runConversationIntelligenceTests() {
  console.log('\n================================================================');
  console.log('🧪 RUNNING CRITICAL CONVERSATION INTELLIGENCE REGRESSION SUITE');
  console.log('================================================================\n');

  await connectDatabase();
  await seedDatabase();

  const projectId = 'prycoons-ai';

  // --------------------------------------------------------------------------
  // TEST A: Initial message contains multiple facts
  // User: "I'm looking to buy a 3 BHK in Gota."
  // --------------------------------------------------------------------------
  console.log('[Test A] Initial message contains multiple facts');
  const sessionA = await sessionRepository.createSession({ projectId });
  const stepA = await conversationService.processMessage({
    projectId,
    sessionId: sessionA.id,
    message: "I'm looking to buy a 3 BHK in Gota.",
  });

  assert(stepA.context.intent === 'buy', 'Test A: Intent captured as "buy"');
  assert(stepA.context.discovery.location === 'Gota', 'Test A: Location captured as "Gota"');
  assert(
    stepA.context.discovery.bhk === '3 BHK' || (stepA.context.discovery.homeType && stepA.context.discovery.homeType.includes('3 BHK')),
    'Test A: Configuration captured as 3 BHK'
  );
  assert(stepA.context.discovery.budgetNum === undefined, 'Test A: Budget is unknown');
  assert(
    stepA.message.toLowerCase().includes('budget'),
    'Test A: Assistant asks for budget ("What\'s your approximate budget?")'
  );
  assert(
    !stepA.message.toLowerCase().includes('which area in ahmedabad are you considering'),
    'Test A: MUST NOT ask "Which area in Ahmedabad are you considering?"'
  );
  assert(
    !stepA.propertyCards || stepA.propertyCards.length === 0,
    'Test A: Zero property cards returned until search criteria and search intent are satisfied'
  );

  // --------------------------------------------------------------------------
  // TEST B: Complete search request in one message
  // User: "Show me 3 BHK properties in Gota under ₹1 crore."
  // --------------------------------------------------------------------------
  console.log('\n[Test B] Complete search request in one message');
  const sessionB = await sessionRepository.createSession({ projectId });
  const stepB = await conversationService.processMessage({
    projectId,
    sessionId: sessionB.id,
    message: 'Show me 3 BHK properties in Gota under ₹1 crore.',
  });

  assert(stepB.context.intent === 'buy', 'Test B: Buying intent extracted');
  assert(stepB.context.discovery.location === 'Gota', 'Test B: Gota extracted');
  assert(
    stepB.context.discovery.bhk === '3 BHK' || (stepB.context.discovery.homeType && stepB.context.discovery.homeType.includes('3 BHK')),
    'Test B: 3 BHK configuration extracted'
  );
  assert(stepB.context.discovery.budgetNum === 100, 'Test B: Maximum budget of ₹1 crore extracted (100 lakhs)');
  assert(
    !!stepB.propertyCards && stepB.propertyCards.length > 0,
    'Test B: RAG property retrieval executed immediately'
  );
  assert(
    stepB.propertyCards.length <= 3,
    `Test B: Returns up to three relevant properties by default (got ${stepB.propertyCards.length})`
  );

  for (const card of stepB.propertyCards) {
    assert(!!card.propertyName || !!card.title, `Test B: Card has property title: ${card.title}`);
    assert(!!card.image || !!card.propertyImageUrl, `Test B: Card retains real image URL: ${card.image || card.propertyImageUrl}`);
    assert(
      card.sourceUrl && !card.sourceUrl.endsWith('prycoons.com/'),
      `Test B: Card has property-specific source URL: ${card.sourceUrl}`
    );
    assert(card.priceRange !== undefined && card.priceRange.length > 0, `Test B: Card has price range: ${card.priceRange}`);
  }

  // --------------------------------------------------------------------------
  // TEST C: Multi-turn preference collection
  // Rent -> Gota -> 3 BHK with monthly rent
  // --------------------------------------------------------------------------
  console.log('\n[Test C] Multi-turn preference collection across turns');
  const sessionC = await sessionRepository.createSession({ projectId });

  // Turn 1: "I'm looking to rent."
  const stepC1 = await conversationService.processMessage({
    projectId,
    sessionId: sessionC.id,
    message: "I'm looking to rent.",
  });
  assert(stepC1.context.intent === 'rent', 'Test C1: Intent is renting');
  assert(stepC1.message.toLowerCase().includes('area') || stepC1.message.toLowerCase().includes('locality'), 'Test C1: Asks for area');
  assert(!stepC1.propertyCards || stepC1.propertyCards.length === 0, 'Test C1: Zero property cards');

  // Turn 2: "Gota."
  const stepC2 = await conversationService.processMessage({
    projectId,
    sessionId: sessionC.id,
    message: 'Gota',
  });
  assert(stepC2.context.discovery.location === 'Gota', 'Test C2: Retains Gota');
  assert(stepC2.context.intent === 'rent', 'Test C2: Retains rent intent');
  assert(stepC2.message.toLowerCase().includes('configuration') || stepC2.message.toLowerCase().includes('bhk'), 'Test C2: Asks for configuration');
  assert(!stepC2.propertyCards || stepC2.propertyCards.length === 0, 'Test C2: Zero property cards');

  // Turn 3: "3 BHK, budget around ₹30,000 per month."
  const stepC3 = await conversationService.processMessage({
    projectId,
    sessionId: sessionC.id,
    message: '3 BHK, budget around ₹30,000 per month.',
  });
  assert(stepC3.context.intent === 'rent', 'Test C3: Retains renting intent');
  assert(stepC3.context.discovery.location === 'Gota', 'Test C3: Retains Gota');
  assert(
    stepC3.context.discovery.bhk === '3 BHK' || (stepC3.context.discovery.homeType && stepC3.context.discovery.homeType.includes('3 BHK')),
    'Test C3: Retains 3 BHK'
  );
  assert(stepC3.context.discovery.rentMonthly === 30000, 'Test C3: Extracted monthly rental budget of ₹30,000/mo');
  assert(
    stepC3.context.discovery.budgetNum === undefined,
    'Test C3: Does NOT confuse monthly rent with purchase budget (budgetNum is undefined)'
  );
  assert(
    stepC3.message.toLowerCase().includes('show') || stepC3.message.toLowerCase().includes('matching'),
    'Test C3: Asks naturally whether user would like to see matching properties'
  );
  assert(!stepC3.propertyCards || stepC3.propertyCards.length === 0, 'Test C3: Zero property cards before confirmation');

  // Preference update turn: "Actually, show me 2 BHK options instead."
  const stepC4 = await conversationService.processMessage({
    projectId,
    sessionId: sessionC.id,
    message: 'Actually, show me 2 BHK options instead.',
  });
  assert(
    stepC4.context.discovery.bhk === '2 BHK' || (stepC4.context.discovery.homeType && stepC4.context.discovery.homeType.includes('2 BHK')),
    'Test C4: Configuration updated to 2 BHK'
  );
  assert(stepC4.context.discovery.location === 'Gota', 'Test C4: Preserves Gota locality');
  assert(stepC4.context.intent === 'rent', 'Test C4: Preserves rent intent');
  assert(stepC4.context.discovery.rentMonthly === 30000, 'Test C4: Preserves monthly rent');

  // --------------------------------------------------------------------------
  // TEST D: Specific property details
  // User: "Tell me more about Aahvan Greens."
  // --------------------------------------------------------------------------
  console.log('\n[Test D] Specific property details (Aahvan Greens)');
  const sessionD = await sessionRepository.createSession({ projectId });
  const stepD = await conversationService.processMessage({
    projectId,
    sessionId: sessionD.id,
    message: 'Tell me more about Aahvan Greens.',
  });

  assert(
    stepD.message.toLowerCase().includes('aahvan greens') || stepD.message.toLowerCase().includes('science city'),
    'Test D: Response answers specifically about Aahvan Greens'
  );
  assert(
    !stepD.message.includes('[details not specified') && !stepD.message.includes('[not specified'),
    'Test D: Response contains no empty placeholders like [details not specified in the context]'
  );
  assert(
    stepD.propertyCards !== undefined && stepD.propertyCards.length === 1,
    `Test D: Returns only 1 property card for the named project, not 3 unrelated (got ${stepD.propertyCards?.length})`
  );
  assert(
    stepD.propertyCards[0].title.toLowerCase().includes('aahvan greens'),
    'Test D: Card is indeed Aahvan Greens'
  );
  assert(
    stepD.propertyCards[0].sourceUrl === CANONICAL_PROPERTY_URLS['aahvan greens'],
    `Test D: Card has exact canonical property link: ${stepD.propertyCards[0].sourceUrl}`
  );

  // --------------------------------------------------------------------------
  // TEST E: Follow-up reference ("What is the price of the second one?")
  // --------------------------------------------------------------------------
  console.log('\n[Test E] Follow-up reference resolution ("What is the price of the second one?")');
  const sessionE = await sessionRepository.createSession({ projectId });

  // First search displays 3 properties
  const stepE1 = await conversationService.processMessage({
    projectId,
    sessionId: sessionE.id,
    message: 'Show me verified properties in Ahmedabad',
  });
  assert(
    stepE1.propertyCards !== undefined && stepE1.propertyCards.length === 3,
    `Test E1: Initial search displayed 3 properties (got ${stepE1.propertyCards?.length})`
  );

  const secondProperty = stepE1.propertyCards[1];
  console.log(`  Second property displayed: "${secondProperty.title}" (${secondProperty.priceRange})`);

  // Follow-up: "What is the price of the second one?"
  const stepE2 = await conversationService.processMessage({
    projectId,
    sessionId: sessionE.id,
    message: 'What is the price of the second one?',
  });

  assert(
    stepE2.message.toLowerCase().includes(secondProperty.title.toLowerCase()) ||
    stepE2.message.toLowerCase().includes(secondProperty.priceRange.toLowerCase()),
    `Test E2: Response resolves the second property (${secondProperty.title}) and states its price (${secondProperty.priceRange})`
  );
  assert(
    !stepE2.message.toLowerCase().includes('which property') && !stepE2.message.toLowerCase().includes('clarify which'),
    'Test E2: Does NOT ask redundant clarification ("Which property do you mean?")'
  );
  assert(
    stepE2.propertyCards !== undefined && stepE2.propertyCards.length === 1,
    `Test E2: Displays only the single referenced property card, not an unrelated 3-property list (got ${stepE2.propertyCards?.length})`
  );
  assert(
    stepE2.propertyCards[0].title.toLowerCase() === secondProperty.title.toLowerCase(),
    'Test E2: Displayed card matches the second property'
  );

  // --------------------------------------------------------------------------
  // TEST F: General real-estate terminology question
  // User: "What does 3 BHK mean?"
  // --------------------------------------------------------------------------
  console.log('\n[Test F] General real-estate terminology question ("What does 3 BHK mean?")');
  const sessionF = await sessionRepository.createSession({ projectId });
  const stepF = await conversationService.processMessage({
    projectId,
    sessionId: sessionF.id,
    message: 'What does 3 BHK mean?',
  });

  assert(
    stepF.message.toLowerCase().includes('bedroom') &&
    stepF.message.toLowerCase().includes('hall') &&
    stepF.message.toLowerCase().includes('kitchen'),
    'Test F: Explains 3 BHK clearly as Bedrooms, Hall, Kitchen'
  );
  assert(
    !stepF.propertyCards || stepF.propertyCards.length === 0,
    'Test F: Zero property cards returned for educational terminology question'
  );

  // --------------------------------------------------------------------------
  // TEST G: Multiple unrelated topics handled politely
  // --------------------------------------------------------------------------
  console.log('\n[Test G] Multiple unrelated topics handled politely with 0 cards');
  const unrelatedQueries = [
    { query: 'Can you recommend a movie?', topic: 'movie', serviceHint: 'imdb' },
    { query: 'Can you help me debug my Python code?', topic: 'coding', serviceHint: 'stack overflow' },
    { query: 'What is the capital of Japan?', topic: 'general trivia', serviceHint: 'tokyo' },
    { query: 'How do I cook a chicken biryani?', topic: 'cooking', serviceHint: 'recipes' },
    { query: 'Who won yesterday\'s IPL match?', topic: 'sports', serviceHint: 'espcricinfo' },
  ];

  for (const item of unrelatedQueries) {
    const sessionG = await sessionRepository.createSession({ projectId });
    const stepG = await conversationService.processMessage({
      projectId,
      sessionId: sessionG.id,
      message: item.query,
    });

    assert(
      stepG.message.toLowerCase().includes('real estate') || stepG.message.toLowerCase().includes('properties'),
      `Test G (${item.topic}): Polite deflection communicates real estate focus`
    );
    assert(
      !stepG.message.toLowerCase().includes('irrelevant') && !stepG.message.toLowerCase().includes('not allowed'),
      `Test G (${item.topic}): Does not use harsh robotic phrasing`
    );
    assert(
      !stepG.propertyCards || stepG.propertyCards.length === 0,
      `Test G (${item.topic}): Zero property cards returned`
    );
  }

  // --------------------------------------------------------------------------
  // TEST H: Memory persistence across turns and session reloading
  // --------------------------------------------------------------------------
  console.log('\n[Test H] Memory persistence across turns and session reloading');
  const sessionH = await sessionRepository.createSession({ projectId });

  await conversationService.processMessage({
    projectId,
    sessionId: sessionH.id,
    message: 'My name is Ananya',
  });
  await conversationService.processMessage({
    projectId,
    sessionId: sessionH.id,
    message: 'I want to buy a 3 BHK in Science City',
  });

  // Reload session from PostgreSQL database
  const reloadedSession = await sessionRepository.getSessionById(sessionH.id);
  assert(reloadedSession !== null, 'Test H: Session exists in database');
  const reloadedMeta = reloadedSession?.sessionMetadata;
  assert(reloadedMeta.userName === 'Ananya', 'Test H: User name "Ananya" persisted');
  assert(reloadedMeta.intent === 'buy', 'Test H: Buying intent persisted');
  assert(reloadedMeta.discovery.location === 'Science city', 'Test H: Location "Science city" persisted');
  assert(
    reloadedMeta.discovery.bhk === '3 BHK' || (reloadedMeta.discovery.homeType && reloadedMeta.discovery.homeType.includes('3 BHK')),
    'Test H: Configuration "3 BHK" persisted'
  );

  // Check complete message history in database
  const messagesInDb = await messageRepository.getMessagesBySessionId(sessionH.id);
  assert(messagesInDb.length === 4, `Test H: Exactly 4 messages recorded in DB (got ${messagesInDb.length})`);
  assert(messagesInDb[0].role === 'USER', 'Test H: Message 1 is USER');
  assert(messagesInDb[1].role === 'ASSISTANT', 'Test H: Message 2 is ASSISTANT');
  assert(messagesInDb[2].role === 'USER', 'Test H: Message 3 is USER');
  assert(messagesInDb[3].role === 'ASSISTANT', 'Test H: Message 4 is ASSISTANT');

  console.log('\n================================================================');
  console.log('🎉 ALL CRITICAL CONVERSATION INTELLIGENCE REGRESSION TESTS PASSED (A–H)');
  console.log('================================================================\n');
}

runConversationIntelligenceTests().catch((err) => {
  console.error('\n❌ CRITICAL CONVERSATION INTELLIGENCE TEST SUITE FAILED:', err);
  process.exit(1);
});
