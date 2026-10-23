import { conversationService } from '../src/services/chatbot/conversation.service';
import { propertyMatcherService } from '../src/services/rag/propertyMatcher.service';
import { retrievalService } from '../src/services/rag/retrieval.service';
import { sessionRepository } from '../src/repositories/session.repository';
import { projectRepository } from '../src/repositories/project.repository';
import { CANONICAL_PROPERTY_URLS } from '../src/services/rag/propertyMatcher.service';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

import { connectDatabase } from '../src/config/database';
import { seedDatabase } from '../src/config/seed';

async function runRegressionSuite() {
  console.log('\n================================================================');
  console.log('🧪 RUNNING BRIM CONVERSATION FLOW & PROPERTY RETRIEVAL TEST SUITE');
  console.log('================================================================');

  await connectDatabase();
  await seedDatabase();

  const projectId = 'prycoons-ai';

  // --------------------------------------------------------------------------
  // TEST A: Welcome Message on Fresh Session
  // --------------------------------------------------------------------------
  console.log('\n[Test A] Initial Welcome Message');
  const sessionA = await sessionRepository.createSession({ projectId });
  const welcomeExpected = "Hi 👋 Welcome to BRIM Real Estate Assistant! I'm here to help you explore properties and find a home that suits your needs. What should I call you?";
  
  // Verify project welcome message
  const projMeta = await projectRepository.findById(projectId);
  assert(projMeta?.welcomeMessage === welcomeExpected, 'Project metadata has exact welcome message');
  
  // Verify first prompt interaction when empty/greet
  const welcomeResp = await conversationService.processMessage({
    projectId,
    sessionId: sessionA.id,
    message: 'Hello',
  });
  assert(welcomeResp.message.includes('What should I call you') || welcomeResp.message.includes('call you'), 'Assistant politely asks for user name');
  assert(!welcomeResp.propertyCards || welcomeResp.propertyCards.length === 0, 'No property cards appear on welcome');

  // --------------------------------------------------------------------------
  // TEST B: Normal Conversation & Name Collection
  // --------------------------------------------------------------------------
  console.log('\n[Test B] Normal Conversation & Name Collection');
  const sessionB = await sessionRepository.createSession({ projectId });
  
  const stepB1 = await conversationService.processMessage({
    projectId,
    sessionId: sessionB.id,
    message: 'Hi',
  });
  assert(!stepB1.propertyCards || stepB1.propertyCards.length === 0, 'Step B1 (Hi): Zero property cards');

  const stepB2 = await conversationService.processMessage({
    projectId,
    sessionId: sessionB.id,
    message: 'My name is Rahul',
  });
  assert(stepB2.context.userName === 'Rahul', 'Step B2 (Name): Rahul stored in session context');
  assert(stepB2.message.includes('Rahul'), 'Step B2: Assistant greets Rahul naturally');
  assert(!stepB2.propertyCards || stepB2.propertyCards.length === 0, 'Step B2: Zero property cards returned after name collection');

  // --------------------------------------------------------------------------
  // TEST C: Preference Collection Flow (Buy -> Gota -> Budget)
  // --------------------------------------------------------------------------
  console.log('\n[Test C] Preference Collection Flow');
  const sessionC = await sessionRepository.createSession({
    projectId,
    sessionMetadata: {
      state: 'NAME_COLLECTED',
      stepIndex: 1,
      discovery: {},
      lead: { name: 'Rahul' },
      userName: 'Rahul',
    },
  });

  // User answers "Buy"
  const stepC1 = await conversationService.processMessage({
    projectId,
    sessionId: sessionC.id,
    message: 'Buy',
  });
  assert(stepC1.context.intent === 'buy', 'Step C1: Intent "buy" captured in state');
  assert(!stepC1.propertyCards || stepC1.propertyCards.length === 0, 'Step C1: Zero property cards when stating Buy');

  // User answers "Gota"
  const stepC2 = await conversationService.processMessage({
    projectId,
    sessionId: sessionC.id,
    message: 'Gota',
  });
  assert(stepC2.context.discovery.location === 'Gota', 'Step C2: Locality "Gota" stored in state');
  assert(!stepC2.propertyCards || stepC2.propertyCards.length === 0, 'Step C2: Zero property cards when providing locality');

  // User answers "Under ₹1 crore"
  const stepC3 = await conversationService.processMessage({
    projectId,
    sessionId: sessionC.id,
    message: 'Under ₹1 crore',
  });
  assert(!stepC3.propertyCards || stepC3.propertyCards.length === 0, 'Step C3: Zero property cards while collecting budget');
  assert(stepC3.message.includes('show you') || stepC3.message.includes('options') || stepC3.message.includes('Gota'), 'Step C3: Asks naturally whether user would like to see matching properties');

  // --------------------------------------------------------------------------
  // TEST D: Explicit Property Search In One Message
  // --------------------------------------------------------------------------
  console.log('\n[Test D] Explicit Property Search In One Message');
  const sessionD = await sessionRepository.createSession({ projectId });
  const stepD = await conversationService.processMessage({
    projectId,
    sessionId: sessionD.id,
    message: 'Show me 3 BHK properties in Gota under ₹1 crore.',
  });
  assert(!!stepD.propertyCards && stepD.propertyCards.length > 0, 'Step D: Returns property cards immediately for explicit search');
  assert(stepD.propertyCards.length <= 3, `Step D: Shows maximum 3 property cards by default (got ${stepD.propertyCards.length})`);
  
  for (const card of stepD.propertyCards) {
    assert(!!card.propertyName || !!card.title, 'Card has valid property title/name');
    assert(!!card.image || !!card.propertyImageUrl, 'Card retains real working image URL');
    assert(card.sourceUrl && !card.sourceUrl.endsWith('prycoons.com/'), `Card URL is specific, not bare homepage: ${card.sourceUrl}`);
  }

  // --------------------------------------------------------------------------
  // TEST E: Search After Collecting Preferences (Agreement)
  // --------------------------------------------------------------------------
  console.log('\n[Test E] Search After Collecting Preferences & Agreement');
  // Continuing session C from step C3 where it asked permission
  const stepE = await conversationService.processMessage({
    projectId,
    sessionId: sessionC.id,
    message: 'Yes, please show me options',
  });
  assert(!!stepE.propertyCards && stepE.propertyCards.length > 0, 'Step E: Retrieved property cards upon agreement');
  assert(stepE.propertyCards.length <= 3, `Step E: Shows max 3 cards (got ${stepE.propertyCards.length})`);
  assert(stepE.propertyCards.some(c => c.location.toLowerCase().includes('gota') || c.title.toLowerCase().includes('ananta')), 'Step E: Matching properties respect Gota locality filter');

  // --------------------------------------------------------------------------
  // TEST F: Specific Property Question (e.g. Aahvan Greens)
  // --------------------------------------------------------------------------
  console.log('\n[Test F] Specific Property Question (Aahvan Greens)');
  const sessionF = await sessionRepository.createSession({ projectId });
  const stepF = await conversationService.processMessage({
    projectId,
    sessionId: sessionF.id,
    message: 'Tell me about Aahvan Greens.',
  });
  assert(stepF.message.toLowerCase().includes('aahvan greens') || stepF.message.toLowerCase().includes('science city'), 'Step F: Answers specifically about Aahvan Greens');
  if (stepF.propertyCards && stepF.propertyCards.length > 0) {
    assert(stepF.propertyCards.length === 1, `Step F: Shows only 1 card for the specific property, not 3 unrelated (got ${stepF.propertyCards.length})`);
    assert(stepF.propertyCards[0].title.toLowerCase().includes('aahvan greens'), 'Step F: Card is indeed Aahvan Greens');
    assert(stepF.propertyCards[0].sourceUrl === 'https://prycoons.com/property/aahvan-greens-in-science-city-ahmedabad/', 'Step F: Card has exact canonical detail URL');
  }

  // --------------------------------------------------------------------------
  // TEST G: General Real-Estate Question
  // --------------------------------------------------------------------------
  console.log('\n[Test G] General Real-Estate Question');
  const sessionG = await sessionRepository.createSession({ projectId });
  const stepG = await conversationService.processMessage({
    projectId,
    sessionId: sessionG.id,
    message: 'What does a 3 BHK apartment mean?',
  });
  assert(stepG.message.toLowerCase().includes('bedroom') && stepG.message.toLowerCase().includes('hall') && stepG.message.toLowerCase().includes('kitchen'), 'Step G: Explains 3 BHK clearly (Bedrooms, Hall, Kitchen)');
  assert(!stepG.propertyCards || stepG.propertyCards.length === 0, 'Step G: Zero property cards returned for terminology question');

  // --------------------------------------------------------------------------
  // TEST H: Unrelated Question Handling
  // --------------------------------------------------------------------------
  console.log('\n[Test H] Unrelated Question Handling');
  const sessionH = await sessionRepository.createSession({ projectId });
  const stepH = await conversationService.processMessage({
    projectId,
    sessionId: sessionH.id,
    message: 'Can you recommend a movie?',
  });
  assert(stepH.message.toLowerCase().includes('real estate'), 'Step H: Polite response clarifies focus on real estate');
  assert(!stepH.message.toLowerCase().includes('irrelevant question'), 'Step H: Not harsh or robotic');
  assert(!stepH.propertyCards || stepH.propertyCards.length === 0, 'Step H: Zero property cards returned for movie query');

  // --------------------------------------------------------------------------
  // TEST I: Show More Options (Pagination & Deduplication)
  // --------------------------------------------------------------------------
  console.log('\n[Test I] Show More Options Pagination');
  // First search
  const sessionI = await sessionRepository.createSession({ projectId });
  const stepI1 = await conversationService.processMessage({
    projectId,
    sessionId: sessionI.id,
    message: 'Show me verified properties in Ahmedabad',
  });
  assert(stepI1.propertyCards && stepI1.propertyCards.length === 3, 'Step I1: Shows top 3 properties');
  const firstBatchTitles = stepI1.propertyCards.map(c => c.title);

  // Now ask for more
  const stepI2 = await conversationService.processMessage({
    projectId,
    sessionId: sessionI.id,
    message: 'Show me more options',
  });
  assert(stepI2.propertyCards && stepI2.propertyCards.length > 0, 'Step I2: Returns next batch of property cards');
  assert(stepI2.propertyCards.length <= 3, `Step I2: Returns at most 3 cards (got ${stepI2.propertyCards.length})`);
  
  const secondBatchTitles = stepI2.propertyCards.map(c => c.title);
  for (const title of secondBatchTitles) {
    assert(!firstBatchTitles.includes(title), `Step I2: "${title}" is not repeated from batch 1`);
  }
  console.log(`  Batch 1: ${firstBatchTitles.join(', ')}`);
  console.log(`  Batch 2: ${secondBatchTitles.join(', ')}`);

  // --------------------------------------------------------------------------
  // TEST J: Exact Canonical Property Detail Links
  // --------------------------------------------------------------------------
  console.log('\n[Test J] Exact Canonical Property Detail Links');
  // Check canonical dictionary for 3 major properties
  const testProjects = ['Aahvan Greens', 'Ananta', 'Satyamev Serene'];
  for (const name of testProjects) {
    const canonical = CANONICAL_PROPERTY_URLS[name.toLowerCase()];
    assert(!!canonical, `Canonical URL exists for ${name}`);
    assert(canonical.startsWith('https://prycoons.com/property/'), `Canonical URL has /property/ path: ${canonical}`);
    assert(canonical !== 'https://prycoons.com/', `Canonical URL is not bare homepage`);
  }

  // --------------------------------------------------------------------------
  // TEST K: System Regressions & Persistence
  // --------------------------------------------------------------------------
  console.log('\n[Test K] Persistence & Memory Regression');
  const sessionCheck = await sessionRepository.getSessionById(sessionB.id);
  assert(sessionCheck !== null, 'Session persisted in database');
  assert(sessionCheck?.userName === 'Rahul' || sessionCheck?.sessionMetadata?.userName === 'Rahul', 'User name persisted in session');

  console.log('\n================================================================');
  console.log('🎉 ALL BRIM CONVERSATION FLOW & RETRIEVAL TESTS PASSED (A–K)');
  console.log('================================================================\n');
}

runRegressionSuite().catch(err => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
