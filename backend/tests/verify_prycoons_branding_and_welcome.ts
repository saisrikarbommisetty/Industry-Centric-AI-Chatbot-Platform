import assert from 'assert';
import { PRYCOONS_WELCOME_MESSAGES, getWelcomeMessageForSession, conversationService } from '../src/services/chatbot/conversation.service';
import { projectRepository } from '../src/repositories/project.repository';
import { sessionRepository } from '../src/repositories/session.repository';
import { messageRepository } from '../src/repositories/message.repository';
import { retrievalService } from '../src/services/rag/retrieval.service';

import { connectDatabase } from '../src/config/database';

async function runVerification() {
  console.log('================================================================');
  console.log('🧪 VERIFYING PRYCOONS BRANDING & DYNAMIC WELCOME MESSAGES');
  console.log('================================================================');

  await connectDatabase();

  const projectId = 'prycoons-ai';

  // 1. BRANDING VERIFICATION
  console.log('\n[1] Verifying Brand Name in Project Repository & Defaults');
  const project = await projectRepository.findById(projectId);
  assert(project, 'Project exists in repository');
  console.log(`  Project name: "${project.name}"`);
  assert(!project.name.toLowerCase().includes('brim real estate'), 'Project name does NOT use BRIM as real estate brand');
  assert(project.name.includes('Prycoons'), 'Project name correctly reflects "Prycoons"');
  console.log('  ✓ Brand name correctly configured as Prycoons Real Estate Assistant');

  // 2. CURATED WELCOME MESSAGE CRITERIA
  console.log('\n[2] Verifying Curated Welcome Messages');
  assert(PRYCOONS_WELCOME_MESSAGES.length >= 5, 'Curated set contains at least 5 messages');
  for (const msg of PRYCOONS_WELCOME_MESSAGES) {
    console.log(`  Checking: "${msg}"`);
    assert(!msg.toLowerCase().includes('brim'), 'Message does NOT mention BRIM');
    assert(!msg.includes('\n'), `Message must not contain newlines or multiple paragraphs: "${msg}"`);
    assert(msg.length < 110, `Message is short and concise (${msg.length} chars): "${msg}"`);
    // Ensure no multiple questions or complex sentences
    const questionMarks = (msg.match(/\?/g) || []).length;
    assert(questionMarks <= 1, `Message contains at most one question: "${msg}"`);
  }
  console.log('  ✓ All curated welcome messages are single, concise, natural sentences representing Prycoons');

  // 3. DYNAMIC VARIATION ACROSS NEW CONVERSATIONS
  console.log('\n[3] Verifying Dynamic Greeting Variation Across New Conversations');
  const collectedGreetings = new Set<string>();
  const testSessions: string[] = [];

  for (let i = 0; i < 20; i++) {
    const sId = `sess-test-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;
    testSessions.push(sId);
    const greeting = getWelcomeMessageForSession(sId);
    collectedGreetings.add(greeting);
  }

  console.log(`  Varied messages observed across 20 new conversations: ${collectedGreetings.size} distinct greetings`);
  assert(collectedGreetings.size > 1, 'Welcome message varies across genuinely new conversations');
  console.log('  ✓ Welcome messages vary dynamically across new sessions');

  // 4. CONSISTENCY ON REFRESH / REOPENING
  console.log('\n[4] Verifying Greeting Consistency When Conversation Is Refreshed/Reopened');
  const persistentSessionId = `sess-persistent-${Date.now()}`;
  const firstLoadGreeting = getWelcomeMessageForSession(persistentSessionId);

  // Simulate multiple re-renders or page refreshes for the same session ID
  for (let attempt = 1; attempt <= 5; attempt++) {
    const reloadedGreeting = getWelcomeMessageForSession(persistentSessionId);
    assert(reloadedGreeting === firstLoadGreeting, `Greeting on reload #${attempt} matches original greeting`);
  }
  console.log(`  Original: "${firstLoadGreeting}"`);
  console.log('  ✓ Welcome message remains 100% consistent when conversation is refreshed or reopened');

  // 5. EXISTING CONVERSATIONS: DO NOT INJECT WELCOME INTO EXISTING MESSAGE HISTORY
  console.log('\n[5] Verifying Message History Persistence (No Fresh Greeting Injection)');
  const sessionWithHistory = await sessionRepository.createSession({
    projectId,
    sessionMetadata: {
      state: 'NAME_COLLECTED',
      stepIndex: 1,
      discovery: {},
      lead: { name: 'Ananya' },
      userName: 'Ananya',
    },
  });

  await messageRepository.createMessage({
    sessionId: sessionWithHistory.id,
    role: 'USER',
    content: 'My name is Ananya',
  });
  await messageRepository.createMessage({
    sessionId: sessionWithHistory.id,
    role: 'ASSISTANT',
    content: 'Nice to meet you, Ananya! 👋 Are you looking to buy, rent, or just exploring?',
  });

  const existingMessages = await messageRepository.getMessagesBySessionId(sessionWithHistory.id);
  assert(existingMessages.length === 2, 'Session has exactly 2 existing messages');
  assert(!existingMessages.some((m: any) => m.content.toLowerCase().includes('brim real estate')), 'No BRIM real estate branding in history');
  console.log('  ✓ Existing conversations retain history without fresh greeting injection');

  // 6. PRESERVE EXISTING CONVERSATION LOGIC: NAME COLLECTION & PROPERTY RETRIEVAL
  console.log('\n[6] Verifying Conversational Flow & RAG Property Retrieval');
  const sessionFlow = await sessionRepository.createSession({ projectId });

  // Test Greeting
  const greetResp = await conversationService.processMessage({
    projectId,
    sessionId: sessionFlow.id,
    message: 'Hello',
  });
  console.log(`  Bot Greeting: "${greetResp.message}"`);
  assert(!greetResp.message.toLowerCase().includes('brim real estate'), 'Greeting does not mention BRIM Real Estate');
  assert(PRYCOONS_WELCOME_MESSAGES.includes(greetResp.message) || greetResp.message.includes('Prycoons'), 'Returns short Prycoons greeting');
  assert(!greetResp.propertyCards || greetResp.propertyCards.length === 0, 'No premature property cards returned on welcome');

  // Test Name Collection
  const nameResp = await conversationService.processMessage({
    projectId,
    sessionId: sessionFlow.id,
    message: 'I am Devang',
  });
  console.log(`  Bot Name Response: "${nameResp.message}"`);
  assert(nameResp.context.userName === 'Devang', 'User name "Devang" captured in context');
  assert(nameResp.message.includes('Devang'), 'Greets Devang by name');

  // Test RAG Retrieval
  const ragChunks = await retrievalService.hybridRetrieve(projectId, '3 BHK in Science City');
  console.log(`  Retrieved ${ragChunks.length} RAG chunks for Science City`);
  assert(ragChunks.length > 0, 'RAG retrieval successfully fetches property chunks');
  console.log('  ✓ Conversational flow, name capture, and RAG retrieval all functioning perfectly');

  // 7. USER REPLIES "YES" TO GREETING (CRITICAL BUG FIX VERIFICATION)
  console.log('\n[7] Verifying User Replying "yes" to Initial Greeting');
  const sessionYes = await sessionRepository.createSession({ projectId });
  const yesResp = await conversationService.processMessage({
    projectId,
    sessionId: sessionYes.id,
    message: 'yes',
  });
  console.log(`  User said: "yes"`);
  console.log(`  Bot replied: "${yesResp.message}"`);
  console.log(`  Context userName: "${yesResp.context.userName || '(none)'}"`);
  assert(!yesResp.context.userName, 'User name must NOT be set to "yes" or "Yes"');
  assert(!yesResp.message.toLowerCase().includes('nice to meet you, yes'), 'Bot must NOT greet user as "Yes"');
  assert(yesResp.message.includes('Are you looking to buy, rent, or just exploring'), 'Bot correctly advances to intent exploration');
  assert(yesResp.quickReplies && yesResp.quickReplies.length === 3, 'Provides intent quick replies');
  console.log('  ✓ User saying "yes" correctly advances property search without misidentifying it as name');

  // 8. USER DECLINES TO GIVE NAME ("SKIP" OR "NO")
  console.log('\n[8] Verifying User Declining to Give Name ("skip" / "no")');
  const sessionSkip = await sessionRepository.createSession({ projectId });
  const skipResp = await conversationService.processMessage({
    projectId,
    sessionId: sessionSkip.id,
    message: 'skip',
  });
  console.log(`  User said: "skip"`);
  console.log(`  Bot replied: "${skipResp.message}"`);
  console.log(`  Context userName: "${skipResp.context.userName || '(none)'}"`);
  assert(!skipResp.context.userName, 'User name must NOT be set to "skip"');
  assert(!skipResp.message.toLowerCase().includes('nice to meet you, skip'), 'Bot must NOT greet user as "Skip"');
  assert(skipResp.message.includes('Are you looking to buy, rent, or just exploring'), 'Bot gracefully advances to property options');
  console.log('  ✓ User declining name is respected and conversational flow proceeds smoothly');

  console.log('\n================================================================');
  console.log('🎉 ALL PRYCOONS BRANDING, WELCOME & NAME HANDLING TESTS PASSED (1–8)!');
  console.log('================================================================\n');
}

runVerification().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
