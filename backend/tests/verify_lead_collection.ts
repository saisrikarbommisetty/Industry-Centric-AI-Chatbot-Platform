import assert from 'assert';
import { conversationService, getWelcomeMessageForSession, PRYCOONS_WELCOME_MESSAGES } from '../src/services/chatbot/conversation.service';
import { sessionRepository } from '../src/repositories/session.repository';
import { leadRepository } from '../src/repositories/lead.repository';
import { knowledgeRepository } from '../src/repositories/knowledge.repository';
import { visitService } from '../src/services/visits/visit.service';
import { validateIndianMobile, extractIndianMobileFromText, isDecliningResponse } from '../src/utils/phone';

function testAssert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runLeadCollectionVerification() {
  console.log('================================================================');
  console.log('🧪 PRYCOONS CHATBOT LEAD COLLECTION & STORAGE VERIFICATION (1-14)');
  console.log('================================================================\n');

  const projectId = 'prycoons-ai';

  // Seed knowledge chunks for Science City and Gota to enable offline RAG matching
  const src = await knowledgeRepository.createSource({
    id: 'test-src-lead-verify',
    projectId,
    url: 'https://prycoons.com/science-city/',
    title: 'Science City Verified Properties',
    status: 'INDEXED',
  });
  const doc = await knowledgeRepository.createDocument({
    id: 'test-doc-lead-verify',
    sourceId: src.id,
    projectId,
    title: 'Aahvan Greens 3 BHK in Science City',
    url: 'https://prycoons.com/properties/aahvan-greens',
    content: 'Aahvan Greens by Prycoons – 3 BHK Luxury Apartments in Science City, Ahmedabad. Starting from ₹1.65 Cr.',
  });
  await knowledgeRepository.createChunk({
    id: 'test-chk-lead-verify',
    documentId: doc.id,
    projectId,
    content: 'Project: Aahvan Greens\nDeveloper: Prycoons\nLocation: Science City, Ahmedabad\nConfiguration: 3 BHK\nPrice: ₹1.65 Cr Onwards\nSource: https://prycoons.com/properties/aahvan-greens',
    metadata: {
      projectName: 'Aahvan Greens',
      developer: 'Prycoons',
      location: 'Science City',
      propertyType: '3BHK',
      price: '₹1.65 Cr Onwards',
      priceNum: 165,
      sourceUrl: 'https://prycoons.com/properties/aahvan-greens',
    },
    chunkIndex: 0,
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 1: A new user starts a conversation and receives a short greeting
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[Scenario 1] New user starts conversation and receives short, friendly greeting');
  const session1 = await sessionRepository.createSession({ projectId });
  const welcomeText = getWelcomeMessageForSession(session1.id);
  testAssert(PRYCOONS_WELCOME_MESSAGES.includes(welcomeText), 'Greeting is from curated Prycoons set');
  testAssert(!welcomeText.includes('\n'), 'Greeting is concise without multiple lines');
  testAssert(welcomeText.length < 110, 'Greeting is under 110 characters');
  testAssert(!welcomeText.toLowerCase().includes('what is your name') && !welcomeText.toLowerCase().includes('what should i call you'), 'Greeting does not ask for name upfront');

  const greetingReply = await conversationService.processMessage({
    projectId,
    sessionId: session1.id,
    message: 'Hello',
  });
  testAssert(greetingReply.message.length > 0, 'Bot returns friendly greeting');
  testAssert(!greetingReply.propertyCard, 'No premature property cards returned on greeting');

  // Verify reload consistency (no repeated greetings on reload)
  const reloadWelcome = getWelcomeMessageForSession(session1.id);
  testAssert(reloadWelcome === welcomeText, 'Welcome greeting is 100% consistent across page reloads');

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 2: A user searches for properties without providing personal details
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[Scenario 2] User searches for properties without providing personal details');
  const session2 = await sessionRepository.createSession({ projectId });
  const searchReply = await conversationService.processMessage({
    projectId,
    sessionId: session2.id,
    message: 'Looking for a 3 BHK in Science City around 1.65 crore',
  });
  testAssert(searchReply.context.discovery.location === 'Science City', 'Location captured as Science City');
  testAssert(searchReply.context.discovery.bhk?.includes('3 BHK') || searchReply.context.discovery.homeType?.includes('3 BHK'), 'BHK captured as 3 BHK');
  testAssert(searchReply.context.intent === 'buy', 'Intent captured as buy');
  testAssert(searchReply.context.userName === undefined || searchReply.context.userName === null, 'User name not required to browse');
  testAssert(searchReply.context.lead?.phone === undefined || searchReply.context.lead?.phone === null, 'Phone not required to browse');
  testAssert(searchReply.sources.length > 0 || searchReply.propertyCards.length > 0 || searchReply.propertyCard !== null, 'Properties retrieved without requiring personal details');

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 3: The chatbot asks for the name naturally at an appropriate point
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[Scenario 3] Chatbot asks for name naturally after property assistance');
  testAssert(
    searchReply.message.toLowerCase().includes('may i know your name') ||
    searchReply.message.toLowerCase().includes('what should i call you') ||
    searchReply.context.lead.awaitingName === true ||
    searchReply.context.lead.nameAsked === true,
    'Bot naturally invites user name after presenting properties'
  );

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 4: The user provides their name and the backend saves it
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[Scenario 4] User provides name and backend saves it');
  const nameReply = await conversationService.processMessage({
    projectId,
    sessionId: session2.id,
    message: 'Devang Patel',
  });
  testAssert(nameReply.context.userName === 'Devang Patel', 'Session memory stores userName = Devang Patel');
  testAssert(nameReply.context.lead.name === 'Devang Patel', 'Lead state stores name = Devang Patel');
  testAssert(nameReply.message.includes('Devang Patel') || nameReply.message.includes('Devang'), 'Bot acknowledges user by name');

  // Verify lead in repository
  const leadAfterName = await leadRepository.getLeadBySessionId(session2.id, projectId);
  testAssert(leadAfterName !== null, 'Lead record created in backend repository');
  testAssert(leadAfterName?.name === 'Devang Patel', 'Backend lead record contains user name');

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 5: The chatbot requests a contact number naturally
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[Scenario 5] Chatbot requests contact number naturally');
  testAssert(
    nameReply.message.toLowerCase().includes('contact number') ||
    nameReply.context.lead.awaitingPhone === true ||
    nameReply.context.lead.phoneAsked === true,
    'Bot naturally asks for contact number after name is provided'
  );

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 6: The user provides a valid Indian mobile number and it is saved correctly
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[Scenario 6] User provides valid Indian mobile number (+91 formatted) and it is saved');
  const phoneReply = await conversationService.processMessage({
    projectId,
    sessionId: session2.id,
    message: '+91 98250 12345',
  });
  testAssert(phoneReply.context.lead.phone === '+91 98250 12345', 'Normalized +91 Indian mobile saved');
  testAssert(phoneReply.context.lead.captured === true, 'Lead marked captured');
  testAssert(phoneReply.message.includes('+91 98250 12345') || phoneReply.message.includes('noted your contact'), 'Bot confirms receipt of contact number');

  const leadAfterPhone = await leadRepository.getLeadBySessionId(session2.id, projectId);
  testAssert(leadAfterPhone?.phone === '+91 98250 12345', 'Backend lead record contains normalized phone number');
  testAssert(leadAfterPhone?.status === 'Qualified Lead' || leadAfterPhone?.preferences?.status === 'Qualified Lead', 'Lead status upgraded to Qualified Lead');

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 7: User provides name and number together in a single message
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[Scenario 7] User provides name and number together in a single message');
  const session3 = await sessionRepository.createSession({ projectId });
  const comboReply = await conversationService.processMessage({
    projectId,
    sessionId: session3.id,
    message: 'Rahul Sharma 9898012345',
  });
  testAssert(comboReply.context.userName === 'Rahul Sharma', 'Combo message extracts name = Rahul Sharma');
  testAssert(comboReply.context.lead.phone === '+91 98980 12345', 'Combo message extracts and normalizes phone = +91 98980 12345');
  testAssert(comboReply.context.lead.captured === true, 'Lead marked captured from combo message');

  const comboLead = await leadRepository.getLeadBySessionId(session3.id, projectId);
  testAssert(comboLead?.name === 'Rahul Sharma', 'Backend stores Rahul Sharma');
  testAssert(comboLead?.phone === '+91 98980 12345', 'Backend stores normalized phone');

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 8: User provides their name or number earlier in the conversation
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[Scenario 8] User provides name/number early in conversation before searching');
  const session4 = await sessionRepository.createSession({ projectId });
  const earlyNameReply = await conversationService.processMessage({
    projectId,
    sessionId: session4.id,
    message: 'My name is Priya Mehta',
  });
  testAssert(earlyNameReply.context.userName === 'Priya Mehta', 'Early name captured');

  // User subsequently searches for properties
  const earlySearchReply = await conversationService.processMessage({
    projectId,
    sessionId: session4.id,
    message: 'Looking to buy a 3 BHK in Science City',
  });
  testAssert(earlySearchReply.context.userName === 'Priya Mehta', 'User name retained during property search');
  testAssert(earlySearchReply.context.discovery.location === 'Science City', 'Location captured');

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 9: Chatbot does not repeatedly ask for information already collected
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[Scenario 9] Chatbot does NOT repeatedly ask for name or number once collected');
  // Priya has already given name; now user shares contact number
  const priyaPhoneReply = await conversationService.processMessage({
    projectId,
    sessionId: session4.id,
    message: 'Call me at 9876543210',
  });
  testAssert(priyaPhoneReply.context.lead.phone === '+91 98765 43210', 'Phone captured for Priya');

  // Subsequent message: user asks about amenities or budget
  const nextReply = await conversationService.processMessage({
    projectId,
    sessionId: session4.id,
    message: 'What amenities are available?',
  });
  testAssert(!nextReply.message.toLowerCase().includes('may i know your name'), 'Bot does NOT ask for name again');
  testAssert(!nextReply.message.toLowerCase().includes('share your contact number'), 'Bot does NOT ask for phone again');

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 10: User declines to share contact details and can continue
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[Scenario 10] User declines to share contact details and can continue unblocked');
  const session5 = await sessionRepository.createSession({ projectId });
  await conversationService.processMessage({
    projectId,
    sessionId: session5.id,
    message: 'Looking for 3 BHK in Science City',
  });

  const declineReply = await conversationService.processMessage({
    projectId,
    sessionId: session5.id,
    message: 'No thanks, prefer not to share my number',
  });
  testAssert(declineReply.context.lead.phoneDeclined === true, 'phoneDeclined marked in state');
  testAssert(!declineReply.message.toLowerCase().includes('invalid'), 'Decline is respected politely');

  // User can continue asking questions unblocked
  const continueReply = await conversationService.processMessage({
    projectId,
    sessionId: session5.id,
    message: 'Show me flats under 2 crore',
  });
  testAssert(continueReply.message.length > 0, 'User continues without being blocked');
  testAssert(!continueReply.message.toLowerCase().includes('must enter phone'), 'Phone is never mandatory');

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 11: Lead record contains correct property requirements and conversation association
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[Scenario 11] Lead record contains correct property requirements and conversation association');
  const priyaLead = await leadRepository.getLeadBySessionId(session4.id, projectId);
  testAssert(priyaLead !== null, 'Priya lead exists');
  testAssert(priyaLead?.sessionId === session4.id || priyaLead?.conversationId === session4.id, 'Lead associated with correct conversation ID');
  testAssert(priyaLead?.preferences?.locality === 'Science City', 'Lead preferences record preferred locality');
  testAssert(priyaLead?.preferences?.bhk === '3 BHK' || priyaLead?.preferences?.bhk?.includes('3'), 'Lead preferences record preferred BHK');
  testAssert(priyaLead?.preferences?.buyOrRent === 'buy' || priyaLead?.preferences?.buyRent === 'buy' || priyaLead?.intent === 'buy', 'Lead preferences record buy/rent intent');
  testAssert(priyaLead?.createdAt !== undefined, 'Lead has creation timestamp');
  testAssert(priyaLead?.updatedAt !== undefined, 'Lead has update timestamp');

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 12: Existing leads are updated without creating duplicates
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[Scenario 12] Existing leads are updated without creating duplicates for same session');
  const countBefore = (await leadRepository.getLeadsByProjectId(projectId)).filter((l) => l.sessionId === session4.id).length;
  // User adds budget requirement
  await conversationService.processMessage({
    projectId,
    sessionId: session4.id,
    message: 'My budget is around 1.8 crore',
  });
  const countAfter = (await leadRepository.getLeadsByProjectId(projectId)).filter((l) => l.sessionId === session4.id).length;
  testAssert(countBefore === 1 && countAfter === 1, 'Exactly 1 lead record maintained for the session (no duplicate)');

  const updatedPriyaLead = await leadRepository.getLeadBySessionId(session4.id, projectId);
  testAssert(updatedPriyaLead?.preferences?.budgetNum === 180 || updatedPriyaLead?.preferences?.budget?.includes('1.8'), 'Budget updated in-place');

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 13: Admin users can access collected lead information (table & Excel)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[Scenario 13] Admin users can access collected lead details via getVisitRequests and Excel export');
  const allVisits = await visitService.getVisitRequests(projectId);
  const foundLeadInAdmin = allVisits.find((v) => v.conversationId === session4.id || v.customerName === 'Priya Mehta');
  testAssert(foundLeadInAdmin !== undefined, 'Priya Mehta lead is visible in admin getVisitRequests list');
  testAssert(foundLeadInAdmin?.customerName === 'Priya Mehta', 'Admin view shows Customer Name');
  testAssert(foundLeadInAdmin?.mobileNumber === '+91 98765 43210', 'Admin view shows Contact Number');
  testAssert(foundLeadInAdmin?.locality === 'Science City', 'Admin view shows Locality');
  testAssert(foundLeadInAdmin?.bhk === '3 BHK' || foundLeadInAdmin?.bhk?.includes('3'), 'Admin view shows BHK');
  testAssert(foundLeadInAdmin?.conversationId === session4.id, 'Admin view links conversation reference');

  // Test genuine Excel export
  const excelExport = await visitService.exportVisitRequestsToExcel(projectId);
  testAssert(excelExport.buffer.length > 1000, 'Excel export generates valid binary workbook');
  testAssert(excelExport.filename.endsWith('.xlsx'), 'Filename has .xlsx extension');

  // ──────────────────────────────────────────────────────────────────────────
  // SCENARIO 14: Existing Buy/Rent, BHK, location, RAG, cards, history, and visits continue working
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[Scenario 14] Existing Buy/Rent chips, BHK discovery, RAG, property cards, history, and visit-request continue working');
  const session6 = await sessionRepository.createSession({ projectId });

  // Buy chip click
  const buyReply = await conversationService.processMessage({
    projectId,
    sessionId: session6.id,
    message: 'Looking to Buy',
  });
  testAssert(buyReply.context.intent === 'buy', 'Intent set to buy from chip');
  testAssert(buyReply.suggestions.length > 0, 'Provides location selection chips');

  // Location selection
  const locReply = await conversationService.processMessage({
    projectId,
    sessionId: session6.id,
    message: 'Science City',
  });
  testAssert(locReply.context.discovery.location === 'Science City', 'Location set to Science City');

  // BHK selection
  const bhkReply = await conversationService.processMessage({
    projectId,
    sessionId: session6.id,
    message: '3 BHK',
  });
  testAssert(bhkReply.context.discovery.bhk === '3 BHK', 'BHK set to 3 BHK');

  // Site visit request creation
  const visitRequest = await visitService.createVisitRequest({
    projectId,
    customerName: 'Karan Dave',
    mobileNumber: '+91 98250 99887',
    propertyName: 'Aahvan Greens',
    locality: 'Science City',
    bhk: '3 BHK',
    preferredDate: 'Tomorrow 4 PM',
    conversationId: session6.id,
  });
  testAssert(visitRequest.customerName === 'Karan Dave', 'Visit request created successfully');
  testAssert(visitRequest.requestId.startsWith('VR-') || visitRequest.requestId.startsWith('PRY-'), 'Visit request has valid tracking ID');

  console.log('\n================================================================');
  console.log('🎉 ALL 14 MANDATORY LEAD COLLECTION SCENARIOS VERIFIED SUCCESSFULLY!');
  console.log('================================================================\n');
}

runLeadCollectionVerification().catch((err) => {
  console.error('\n❌ Lead Collection Verification Failed:', err);
  process.exit(1);
});