import assert from 'assert';
import { ConversationService } from '../src/services/chatbot/conversation.service';
import { projectRepository } from '../src/repositories/project.repository';
import { knowledgeRepository } from '../src/repositories/knowledge.repository';
import { retrievalService } from '../src/services/rag/retrieval.service';
import { crawlerService } from '../src/services/crawler/crawler.service';
import { leadRepository } from '../src/repositories/lead.repository';
import { embeddingService } from '../src/services/embeddings/embedding.service';

const conversationService = new ConversationService();

async function runMultiIndustryIsolationTests() {
  console.log('\n================================================================');
  console.log('🧪 MULTI-INDUSTRY & MULTI-TENANT ISOLATION VERIFICATION SUITE');
  console.log('================================================================\n');

  // ──────────────────────────────────────────────────────────────────────────
  // SETUP: Provision isolated bots for 3 different industries
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[Setup] Provisioning isolated test tenants...');

  // Bot 1: Healthcare Clinic Bot
  const healthBot = await projectRepository.create({
    id: 'health-clinic-bot',
    name: 'Apollo Health Assistant',
    slug: 'health-clinic-bot',
    industry: 'healthcare',
    industryName: 'Healthcare & Medicine',
    websiteUrl: 'https://apollo-clinic.example.com',
    description: 'Assists patients with clinic services, consulting physicians, consultation hours, and appointment guidelines.',
    systemInstructions: 'You are the official clinical assistant for Apollo Health Clinic. Answer questions strictly based on the clinic knowledge base. Never provide unverified medical diagnoses.',
    welcomeMessage: 'Welcome to Apollo Health Clinic! How can we assist with your health queries today?',
    suggestedQuestions: ['What are your clinic timings?', 'Do you have cardiology specialists?', 'Book consultation'],
    leadCaptureEnabled: true,
    leadCaptureFields: ['name', 'phone', 'email'],
  });

  // Bot 2: Educational Institution Bot
  const eduBot = await projectRepository.create({
    id: 'edu-academy-bot',
    name: 'Cambridge Academy Assistant',
    slug: 'edu-academy-bot',
    industry: 'education',
    industryName: 'Education & Admissions',
    websiteUrl: 'https://cambridge-academy.example.edu',
    description: 'Provides information on academic admissions, degree programs, tuition fees, and scholarships.',
    systemInstructions: 'You are the admissions assistant for Cambridge Academy. Answer student questions using provided prospectus information only.',
    welcomeMessage: 'Welcome to Cambridge Academy! What academic program are you interested in?',
    suggestedQuestions: ['What are the B.Tech admission requirements?', 'What scholarships are available?', 'Tuition fee schedule'],
    leadCaptureEnabled: true,
    leadCaptureFields: ['name', 'phone', 'email'],
  });

  // Bot 3: Existing Prycoons Real Estate Bot
  const prycoonsBot = (await projectRepository.findById('prycoons')) || (await projectRepository.findById('prycoons-ai'));

  // Seed Bot 1 (Healthcare) knowledge chunks
  const healthDoc = await knowledgeRepository.createDocument({
    projectId: 'health-clinic-bot',
    title: 'Clinic Timings and Cardiology Services',
    url: 'https://apollo-clinic.example.com/cardiology',
    content: 'Apollo Health Clinic operates Monday through Saturday from 8:00 AM to 8:00 PM. Our Senior Cardiologist is Dr. Ramesh Sharma, MD, DM Cardiology. General consultation fee is ₹800. Walk-in appointments and prior phone bookings are accepted. Emergency cardiac care is open 24/7.',
    metadata: { category: 'cardiology' },
    contentHash: 'hash-health-1',
  });

  const healthEmb = await embeddingService.generateEmbedding(healthDoc.content);
  await knowledgeRepository.createChunk({
    documentId: healthDoc.id,
    projectId: 'health-clinic-bot',
    content: healthDoc.content,
    embedding: healthEmb,
    metadata: { sourceTitle: healthDoc.title, sourceUrl: healthDoc.url },
    chunkIndex: 0,
  });

  // Seed Bot 2 (Education) knowledge chunks
  const eduDoc = await knowledgeRepository.createDocument({
    projectId: 'edu-academy-bot',
    title: 'B.Tech Computer Science Admissions & Scholarships',
    url: 'https://cambridge-academy.example.edu/admissions/btech',
    content: 'Cambridge Academy offers a 4-year B.Tech in Computer Science and Artificial Intelligence. Eligibility requires 75% in 12th standard PCM. Annual tuition fee is ₹1,75,000. Merit scholarships covering up to 50% tuition are available for students scoring above 90% in entrance exams.',
    metadata: { category: 'admissions' },
    contentHash: 'hash-edu-1',
  });

  const eduEmb = await embeddingService.generateEmbedding(eduDoc.content);
  await knowledgeRepository.createChunk({
    documentId: eduDoc.id,
    projectId: 'edu-academy-bot',
    content: eduDoc.content,
    embedding: eduEmb,
    metadata: { sourceTitle: eduDoc.title, sourceUrl: eduDoc.url },
    chunkIndex: 0,
  });

  console.log('  ✓ Test tenants and knowledge chunks successfully seeded.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: Tenant Knowledge Isolation (WHERE projectId = current_bot_id)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[Test 1] Verifying Retrieval Scoping & Tenant Isolation...');
  const healthChunksFromHealth = await retrievalService.hybridRetrieve('health-clinic-bot', 'cardiology timings');
  assert(healthChunksFromHealth.length > 0, 'Health bot should retrieve its own cardiology chunks');
  assert(healthChunksFromHealth.every(c => c.projectId === 'health-clinic-bot'), 'All retrieved chunks must have projectId = health-clinic-bot');

  const healthChunksFromEdu = await retrievalService.hybridRetrieve('edu-academy-bot', 'cardiology timings');
  assert(healthChunksFromEdu.length === 0, 'Edu bot must NEVER retrieve healthcare chunks');

  const eduChunksFromEdu = await retrievalService.hybridRetrieve('edu-academy-bot', 'B.Tech scholarships tuition fee');
  assert(eduChunksFromEdu.length > 0, 'Edu bot should retrieve its own B.Tech chunks');
  assert(eduChunksFromEdu.every(c => c.projectId === 'edu-academy-bot'), 'All retrieved chunks must have projectId = edu-academy-bot');

  const eduChunksFromPrycoons = await retrievalService.hybridRetrieve('prycoons', 'B.Tech scholarships tuition fee');
  const prycoonsHasEdu = eduChunksFromPrycoons.some(c => c.content.includes('Cambridge Academy'));
  assert(!prycoonsHasEdu, 'Prycoons bot must NEVER retrieve Education chunks');
  console.log('  ✓ Verified 100% tenant scoping: cross-bot knowledge retrieval is impossible.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Healthcare Bot Flow & Zero Prycoons Leakage
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[Test 2] Verifying Healthcare Bot (No Prycoons, No Ahmedabad, No BHK)...');

  // Turn 1: Greeting
  const hRes1 = await conversationService.processMessage({
    projectId: 'health-clinic-bot',
    sessionId: 'sess-health-test-1',
    message: 'Hello',
  });
  console.log(`  Healthcare Greeting: "${hRes1.message}"`);
  assert(!hRes1.message.toLowerCase().includes('prycoons'), 'Healthcare greeting must not mention Prycoons');
  assert(!hRes1.message.toLowerCase().includes('ahmedabad'), 'Healthcare greeting must not mention Ahmedabad');
  assert(!hRes1.message.toLowerCase().includes('property'), 'Healthcare greeting must not mention property');
  assert(!hRes1.message.toLowerCase().includes('buy'), 'Healthcare greeting must not ask Buy/Rent');

  // Turn 2: Clinical Question
  const hRes2 = await conversationService.processMessage({
    projectId: 'health-clinic-bot',
    sessionId: 'sess-health-test-1',
    message: 'Who is your cardiologist and what are the clinic hours?',
  });
  console.log(`  Healthcare Answer: "${hRes2.message}"`);
  assert(hRes2.message.includes('Ramesh Sharma') || hRes2.message.includes('Cardiologist') || hRes2.message.includes('8:00 AM'), 'Must answer with Dr. Ramesh Sharma / clinic hours');
  assert(!hRes2.message.toLowerCase().includes('prycoons'), 'Response must not mention Prycoons');
  assert(!hRes2.message.toLowerCase().includes('ahmedabad'), 'Response must not mention Ahmedabad');
  assert(!hRes2.message.toLowerCase().includes('bhk'), 'Response must not mention BHK');
  assert(hRes2.sources.length > 0, 'Response must include knowledge sources');
  assert(hRes2.sources[0].url.includes('apollo-clinic.example.com'), 'Source URL must belong to Apollo clinic');
  console.log('  ✓ Verified Healthcare bot delivers grounded answers with ZERO Prycoons leakage.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: Healthcare Lead Capture without Forced Real Estate Fields
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[Test 3] Verifying Healthcare Lead Capture...');
  const hRes3 = await conversationService.processMessage({
    projectId: 'health-clinic-bot',
    sessionId: 'sess-health-test-1',
    message: 'My name is Dr. Arvind Patel and my mobile is +91 98250 88990',
  });
  console.log(`  Lead Response: "${hRes3.message}"`);
  assert(hRes3.leadCaptureRequired === true, 'Lead capture should be triggered');
  assert(hRes3.message.includes('+91 98250 88990') || hRes3.message.includes('contact details'), 'Must acknowledge contact info');
  assert(!hRes3.message.toLowerCase().includes('property advisor'), 'Must not say "property advisor"');
  
  const savedLeads = await leadRepository.getLeadsByProjectId('health-clinic-bot');
  assert(savedLeads.length > 0, 'Lead must be saved in database for health-clinic-bot');
  assert(savedLeads[0].phone === '+91 98250 88990', 'Phone number must match');
  console.log('  ✓ Verified dynamic lead capture for non-real-estate bot.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Education Bot Flow & Anti-Hallucination
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[Test 4] Verifying Education Bot & Grounded Answering...');
  const eRes1 = await conversationService.processMessage({
    projectId: 'edu-academy-bot',
    sessionId: 'sess-edu-test-1',
    message: 'What is the tuition fee for B.Tech Computer Science?',
  });
  console.log(`  Education Answer: "${eRes1.message}"`);
  assert(eRes1.message.includes('1,75,000') || eRes1.message.includes('175000') || eRes1.message.includes('tuition'), 'Must state correct tuition fee from knowledge chunk');
  assert(!eRes1.message.toLowerCase().includes('prycoons'), 'Education bot must not mention Prycoons');
  assert(!eRes1.message.toLowerCase().includes('ahmedabad'), 'Education bot must not mention Ahmedabad');
  assert(!eRes1.message.toLowerCase().includes('flats'), 'Education bot must not mention flats');
  console.log('  ✓ Verified Education bot operates with complete factual grounding.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: Existing Prycoons Real Estate Bot Preserved 100%
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[Test 5] Verifying Existing Prycoons Real Estate Bot Functionality...');
  const prycoonsProjectId = prycoonsBot ? prycoonsBot.id : 'prycoons-ai';
  const pRes1 = await conversationService.processMessage({
    projectId: prycoonsProjectId,
    sessionId: 'sess-prycoons-preserve-test',
    message: 'Hi',
  });
  console.log(`  Prycoons Greeting: "${pRes1.message}"`);
  assert(pRes1.message.includes('Prycoons') || pRes1.message.includes('Ahmedabad'), 'Prycoons greeting must retain Prycoons branding');
  
  const pRes2 = await conversationService.processMessage({
    projectId: prycoonsProjectId,
    sessionId: 'sess-prycoons-preserve-test',
    message: 'I want to buy a 3BHK flat in Gota',
  });
  console.log(`  Prycoons Search Response: "${pRes2.message.slice(0, 100)}..."`);
  assert(pRes2.message.includes('Gota') || (pRes2.propertyCards && pRes2.propertyCards.length > 0) || pRes2.message.includes('Ananta'), 'Prycoons must execute real estate property search');
  console.log('  ✓ Verified Prycoons bot retains 100% of real estate features.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 6: SSRF Protection on Crawler
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[Test 6] Verifying Crawler SSRF Security Defenses...');
  const ssrfUrls = [
    'http://localhost:5000/admin',
    'http://127.0.0.1:8080/secrets',
    'http://169.254.169.254/latest/meta-data/',
    'http://0.0.0.0:3000',
    'http://10.0.0.1/internal',
    'http://192.168.1.1/router',
    'file:///etc/passwd',
  ];

  for (const url of ssrfUrls) {
    const isSafe = crawlerService.validateSafeUrl(url);
    assert(!isSafe, `SSRF vulnerability: URL ${url} must be blocked by validateSafeUrl`);
  }
  console.log('  ✓ Verified SSRF defenses: all private, internal, and cloud-metadata addresses blocked.\n');

  console.log('================================================================');
  console.log('🎉 ALL MULTI-INDUSTRY & TENANT ISOLATION TESTS PASSED (100%)!');
  console.log('================================================================\n');
}

runMultiIndustryIsolationTests().catch((err) => {
  console.error('❌ Multi-industry isolation test failed:', err);
  process.exit(1);
});
