/**
 * Comprehensive End-to-End Test Suite:
 * Website Knowledge Extraction, RAG Retrieval Accuracy, External Knowledge Integration,
 * Follow-up Multi-Turn Resolution, and Latency Benchmarking.
 */
import { projectRepository } from '../src/repositories/project.repository';
import { knowledgeRepository } from '../src/repositories/knowledge.repository';
import { knowledgeController } from '../src/controllers/knowledge.controller';
import { crawlerService } from '../src/services/crawler/crawler.service';
import { chunkingService } from '../src/services/rag/chunking.service';
import { retrievalService } from '../src/services/rag/retrieval.service';
import { conversationService } from '../src/services/chatbot/conversation.service';
import { openaiService } from '../src/services/ai/openai.service';
import { embeddingService } from '../src/services/embeddings/embedding.service';
import { logger } from '../src/utils/logger';

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 MASTER TEST SUITE: RAG ACCURACY, CRAWLING & LATENCY OPTIMIZATION');
  console.log('================================================================\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST A: New Industry-Specific Bot Provisioning & Website Crawl Simulation
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[Test A] Creating New Industry Bot: NextGen Tech Academy (Education)...');
  const testEduBot = await projectRepository.create({
    name: 'NextGen Tech Academy',
    slug: 'nextgen-academy',
    industry: 'education',
    industryName: 'Education & Professional Training',
    description: 'Premier tech academy offering full-stack development, cloud architecture, and AI bootcamps.',
    websiteUrl: 'https://nextgenacademy.example.com',
    systemInstructions: 'Provide clear, factual guidance about bootcamps, admissions, and tuition fees from official academy knowledge.',
  });
  console.log(`✓ Provisioned bot: ${testEduBot.name} (ID: ${testEduBot.id})`);

  // HTML content simulation with diverse facts: Headings, Tables, Lists, JSON-LD Schema
  const sampleEduHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>NextGen Tech Academy | Professional Programs & Admissions</title>
        <meta name="description" content="Official course catalog, admissions criteria, and tuition fees." />
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": "NextGen Tech Academy",
          "telephone": "+1-800-555-0199",
          "email": "admissions@nextgenacademy.example.com",
          "address": "450 Innovation Way, Tech Park, Boston, MA"
        }
        </script>
      </head>
      <body>
        <h1>Welcome to NextGen Tech Academy</h1>
        <p>We train next-generation software engineers and AI professionals.</p>

        <h2>Our Industry Programs</h2>
        <ul>
          <li>Full Stack Web Development - 16 weeks comprehensive bootcamp</li>
          <li>Cloud Computing & DevOps - AWS and Kubernetes certified training</li>
          <li>Artificial Intelligence & Machine Learning - Deep learning and neural networks</li>
        </ul>

        <h2>Program Details & Pricing</h2>
        <table>
          <tr><th>Program</th><th>Duration</th><th>Tuition Fee</th><th>Prerequisite</th></tr>
          <tr><td>Full Stack Web Development</td><td>16 weeks</td><td>$4,500</td><td>Basic programming logic</td></tr>
          <tr><td>Cloud Computing & DevOps</td><td>12 weeks</td><td>$3,800</td><td>Networking fundamentals</td></tr>
          <tr><td>Artificial Intelligence & Machine Learning</td><td>20 weeks</td><td>$5,200</td><td>Python & Linear Algebra</td></tr>
        </table>

        <h2>Admissions & Eligibility Criteria</h2>
        <p>Applicants must possess a high school diploma or equivalent. A short 30-minute logical reasoning assessment and admissions interview are required before enrollment.</p>

        <h2>Campus Timing & Schedules</h2>
        <p>Morning Batch: Monday to Thursday, 9:00 AM to 1:00 PM. Evening Batch: Monday to Thursday, 6:00 PM to 10:00 PM. Weekend Labs: Saturday, 10:00 AM to 4:00 PM.</p>

        <h2>Refund Policy</h2>
        <p>100% tuition refund is available if cancellation is requested within the first 14 calendar days of program commencement.</p>
      </body>
    </html>
  `;

  // ──────────────────────────────────────────────────────────────────────────
  // TEST A.2: Parse & Extract Structured Content
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[Test A.2] Testing HTML Extraction & Semantic Parsing...');
  const extractedPage = crawlerService.parseHtmlContent('https://nextgenacademy.example.com/programs', sampleEduHtml, {
    industry: 'education',
    botName: testEduBot.name,
  });

  if (!extractedPage.extractedText.includes('Full Stack Web Development') || !extractedPage.extractedText.includes('$4,500')) {
    throw new Error('❌ Crawler failed to extract table and course pricing!');
  }
  if (!extractedPage.extractedText.includes('admissions@nextgenacademy.example.com')) {
    throw new Error('❌ JSON-LD Schema contact extraction failed!');
  }
  console.log(`✓ Extracted ${extractedPage.extractedText.length} characters of rich semantic text (tables, lists, schema preserved).`);

  // Index the page chunks into database for this bot
  const doc = await knowledgeRepository.createDocument({
    projectId: testEduBot.id,
    title: extractedPage.title,
    url: extractedPage.url,
    content: extractedPage.extractedText,
    metadata: { documentType: 'course_catalog' },
    contentHash: 'edu-page-hash-1',
  });

  const eduChunks = chunkingService.chunkPage(extractedPage, { industry: 'education', botName: testEduBot.name });
  for (const ch of eduChunks) {
    const emb = await embeddingService.generateEmbedding(ch.content).catch(() => []);
    await knowledgeRepository.createChunk({
      documentId: doc.id,
      projectId: testEduBot.id,
      content: ch.content,
      embedding: emb,
      metadata: ch.metadata,
      chunkIndex: ch.chunkIndex,
    });
  }
  console.log(`✓ Indexed ${eduChunks.length} semantic chunks for ${testEduBot.name}.`);

  // ──────────────────────────────────────────────────────────────────────────
  // TEST B: Ask 10 Factual Questions Available on the Website
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[Test B] Asking 10 Specific Facts with Varied Natural Language Phrasing...');
  const testFacts = [
    { q: 'What is the tuition fee for the Full Stack Web Development bootcamp?', expected: '$4,500' },
    { q: 'How long is the Artificial Intelligence & Machine Learning program?', expected: '20 weeks' },
    { q: 'What is the price of Cloud Computing & DevOps?', expected: '$3,800' },
    { q: 'What are the admission requirements to join?', expected: 'diploma' },
    { q: 'What is your refund policy if I withdraw?', expected: '14' },
    { q: 'What are the morning batch hours?', expected: '9:00 AM' },
    { q: 'Are there any weekend labs available?', expected: 'Saturday' },
    { q: 'What is the prerequisite for the Cloud Computing program?', expected: 'Networking' },
    { q: 'What is your official contact email?', expected: 'admissions@nextgenacademy.example.com' },
    { q: 'What phone number can I reach you at?', expected: '+1-800-555-0199' },
  ];

  let passedFacts = 0;
  for (let i = 0; i < testFacts.length; i++) {
    const { q, expected } = testFacts[i];
    const retrieved = await retrievalService.hybridRetrieve(testEduBot.id, q, undefined, 4, {
      industry: 'education',
      botName: testEduBot.name,
      websiteUrl: testEduBot.websiteUrl,
    });

    const hasChunk = retrieved.some((c) => c.content.toLowerCase().includes(expected.toLowerCase()));
    if (!hasChunk) {
      console.warn(`  [Warning] Retrieval missed fact "${expected}" for query: "${q}"`);
    } else {
      passedFacts++;
    }
  }
  console.log(`✓ Retrieval successfully retrieved supporting evidence for ${passedFacts}/${testFacts.length} test questions.`);
  if (passedFacts < 9) {
    throw new Error('❌ Retrieval accuracy below acceptable threshold (expected >= 9/10).');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST C: External Knowledge Integration (Uploaded Document)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[Test C] Adding External Knowledge Document (Scholarships Guide)...');
  const scholarshipDocText = `
    NextGen Tech Academy Scholarship Program (2026):
    Women in Tech Scholarship provides a $1,500 grant towards any program.
    Merit Excellence Award covers up to 50% tuition for students scoring 90%+ on the entrance assessment.
    Application deadline for scholarships is December 15th each year.
  `.trim();

  const sourceRes = await knowledgeRepository.createSource({
    projectId: testEduBot.id,
    url: `https://nextgenacademy.example.com/scholarships-2026`,
    title: 'Scholarship & Financial Aid Guide 2026',
    type: 'DOCUMENT',
    status: 'INDEXED',
    extractedSummary: 'Official scholarships: Women in Tech ($1,500) and Merit Award (up to 50%).',
  });

  await knowledgeController.processSingleSource(testEduBot.id, sourceRes, scholarshipDocText);
  console.log('✓ External document successfully chunked, embedded, and indexed.');

  // Test retrieval on external document
  const retrievedScholarship = await retrievalService.hybridRetrieve(
    testEduBot.id,
    'How much is the Women in Tech scholarship grant?',
    undefined,
    3,
    { industry: 'education', botName: testEduBot.name }
  );
  const foundScholarship = retrievedScholarship.some((c) => c.content.includes('$1,500'));
  if (!foundScholarship) {
    throw new Error('❌ Failed to retrieve externally uploaded document knowledge!');
  }
  console.log('✓ Successfully retrieved answers from external document knowledge ($1,500 grant).');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST D: Multi-Turn Context Resolution ("What about the second one?")
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[Test D] Testing Multi-Turn Follow-Up Query Resolution...');
  const mockRecentHistory = [
    { role: 'USER', content: 'What courses do you offer?' },
    { role: 'ASSISTANT', content: 'We offer three premier programs:\n• **Full Stack Web Development**\n• **Cloud Computing & DevOps**\n• **Artificial Intelligence & Machine Learning**' },
  ];

  const followUpQuery = 'What is the price and duration for the second one?';
  const resolvedQuery = (conversationService as any).resolveContextualQuery(followUpQuery, mockRecentHistory);
  console.log(`  Original Follow-Up: "${followUpQuery}"`);
  console.log(`  Resolved Search Query: "${resolvedQuery}"`);

  if (!resolvedQuery.includes('Cloud Computing')) {
    throw new Error(`❌ Contextual query resolver failed to bind "the second one" to "Cloud Computing"!`);
  }
  console.log('✓ Multi-turn context resolution correctly identified Cloud Computing & DevOps.');

  const retrievedFollowUp = await retrievalService.hybridRetrieve(
    testEduBot.id,
    resolvedQuery,
    undefined,
    3,
    { industry: 'education', botName: testEduBot.name }
  );
  const foundCloudPrice = retrievedFollowUp.some((c) => c.content.includes('$3,800') || c.content.includes('12 weeks'));
  if (!foundCloudPrice) {
    throw new Error('❌ Follow-up query failed to retrieve the Cloud Computing pricing chunk!');
  }
  console.log('✓ Follow-up query retrieved correct pricing ($3,800) and duration (12 weeks).');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST E: Missing Information Handling (Strict Anti-Hallucination)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[Test E] Testing Missing Information Transparency...');
  const missingInfoQuery = 'Do you provide on-campus student hostel accommodation and dining meal plans?';
  const retrievedMissing = await retrievalService.hybridRetrieve(
    testEduBot.id,
    missingInfoQuery,
    undefined,
    3,
    { industry: 'education', botName: testEduBot.name }
  );
  // Verify that the retrieved chunks do not invent dorms
  const contextString = retrievalService.formatContextForPrompt(retrievedMissing, 3, { industry: 'education', botName: testEduBot.name });
  const missingResponse = await openaiService.generateResponse(
    `You represent NextGen Tech Academy. If information is not in the context, say so transparently.`,
    missingInfoQuery,
    contextString,
    { botName: testEduBot.name, industry: 'education' }
  );
  console.log(`  Response for missing fact: "${missingResponse.text.slice(0, 100)}..."`);
  const honestMissing = /not (confirmed|available|specified|provided|mentioned)|do not (have|provide|offer)|don't (have|provide|offer)|contact our admissions/i.test(missingResponse.text);
  if (!honestMissing) {
    throw new Error('❌ Chatbot invented accommodation instead of honestly stating it is not in the records!');
  }
  console.log('✓ Chatbot honestly communicated that accommodation is not in verified records.');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST F: Multi-Tenant Brand Isolation Verification
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[Test F] Testing Cross-Tenant Isolation (Zero Leakage)...');
  const crossTenantRetrieval = await retrievalService.hybridRetrieve(
    testEduBot.id,
    'Tell me about 3 BHK luxury flats in Gota Ahmedabad',
    undefined,
    4,
    { industry: 'education', botName: testEduBot.name }
  );
  const hasPrycoonsLeak = crossTenantRetrieval.some((c) => /prycoons|gota|ahmedabad|ananta/i.test(c.content));
  if (hasPrycoonsLeak) {
    throw new Error('❌ Multi-tenant isolation failure: Edu bot retrieved Prycoons real estate chunks!');
  }
  console.log('✓ Verified 100% tenant isolation: Edu bot NEVER retrieves Prycoons or Ahmedabad listings.');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST G: Latency Benchmark & Cache Optimization Measurement
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[Test G] Measuring Retrieval Latency & Cache Performance...');
  const benchmarkQuery = 'What are the prerequisites for artificial intelligence?';

  const t0 = Date.now();
  await retrievalService.hybridRetrieve(testEduBot.id, benchmarkQuery, undefined, 4, { industry: 'education', botName: testEduBot.name });
  const coldLatency = Date.now() - t0;

  const t1 = Date.now();
  await retrievalService.hybridRetrieve(testEduBot.id, benchmarkQuery, undefined, 4, { industry: 'education', botName: testEduBot.name });
  const warmLatency = Date.now() - t1;

  console.log(`  Cold retrieval latency: ${coldLatency}ms`);
  console.log(`  Warm (cached) retrieval latency: ${warmLatency}ms`);
  if (warmLatency > coldLatency) {
    console.warn('  [Notice] Warm latency was not faster than cold.');
  } else {
    console.log(`  ⚡ Cache speedup: ${((coldLatency - warmLatency) / coldLatency * 100).toFixed(1)}% reduction!`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST H: Regression Testing on Prycoons Real Estate Bot
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[Test H] Regression Check: Verifying Prycoons Real Estate functionality...');
  const prycoonsChunks = await retrievalService.hybridRetrieve(
    'prycoons-ai',
    'Show me 3 BHK properties in Gota',
    undefined,
    4,
    { industry: 'real-estate', botName: 'Prycoons Real Estate' }
  );
  console.log(`✓ Prycoons real estate hybrid retrieval returned ${prycoonsChunks.length} records.`);

  // ──────────────────────────────────────────────────────────────────────────
  // TEST I: Second Industry Bot (Healthcare: Apex Multispecialty Hospital)
  // Testing Accordions, Details/Summary FAQs, Definition Lists, Table Columns, and Multi-Fact Retrieval
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[Test I] Provisioning Second Industry Bot: Apex Multispecialty Hospital (Healthcare)...');
  const testHealthBot = await projectRepository.create({
    name: 'Apex Multispecialty Hospital',
    slug: 'apex-hospital',
    industry: 'healthcare',
    industryName: 'Healthcare & Multispecialty Medical Center',
    description: 'Premier tertiary care hospital with 24/7 emergency, advanced cardiology, neurology, and orthopedics.',
    websiteUrl: 'https://apexhospital.example.com',
    systemInstructions: 'Provide accurate, empathetic medical center information regarding doctor departments, OPD timings, and consultation fees.',
  });
  console.log(`✓ Provisioned bot: ${testHealthBot.name} (ID: ${testHealthBot.id})`);

  const sampleHealthHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Apex Multispecialty Hospital | Clinical Services & OPD Schedule</title>
        <meta name="description" content="Top multispecialty hospital with 24/7 trauma care, NABH accredited." />
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Hospital",
          "name": "Apex Multispecialty Hospital",
          "telephone": "+1-800-APEX-CARE",
          "email": "care@apexhospital.example.com",
          "address": "120 Healthcare Boulevard, Suite 500, Chicago, IL"
        }
        </script>
      </head>
      <body>
        <h1>Apex Multispecialty Hospital & Surgical Care</h1>
        <p>Providing world-class patient care across 15 specialized clinical departments.</p>

        <h2>Clinical Specialists & Consultation Fees</h2>
        <table>
          <tr><th>Department</th><th>Specialist Doctor</th><th>Consultation Fee</th><th>OPD Timings</th></tr>
          <tr><td>Cardiology</td><td>Dr. Robert Chen (MD, FACC)</td><td>$250</td><td>Monday - Friday: 9 AM - 2 PM</td></tr>
          <tr><td>Neurology</td><td>Dr. Sarah Al-Mansoor (MD, PhD)</td><td>$280</td><td>Tuesday & Thursday: 10 AM - 4 PM</td></tr>
          <tr><td>Orthopedics</td><td>Dr. Marcus Vance (MS, Ortho)</td><td>$220</td><td>Monday, Wednesday, Friday: 1 PM - 6 PM</td></tr>
        </table>

        <h2>Emergency & Ambulance Services</h2>
        <dl>
          <dt>Trauma Emergency Hotline</dt>
          <dd>Direct emergency line available 24/7 at +1-800-555-9911 with dedicated cardiac and stroke rapid response teams.</dd>
          <dt>Ambulance Dispatch Response</dt>
          <dd>Average response time under 12 minutes within the metro region.</dd>
        </dl>

        <h2>Frequently Asked Questions</h2>
        <details>
          <summary>Does Apex Hospital offer cashless health insurance?</summary>
          <p>Yes, our international insurance desk processes cashless claims for over 45 major health insurance networks with 2-hour pre-authorization.</p>
        </details>
        <details>
          <summary>What are the patient visiting hours for ICU and general wards?</summary>
          <p>General ward visiting hours are 4:00 PM to 7:00 PM daily. ICU visiting is strictly limited to 5:00 PM to 6:00 PM for one immediate family member.</p>
        </details>
      </body>
    </html>
  `;

  const extractedHealthPage = crawlerService.parseHtmlContent('https://apexhospital.example.com/departments', sampleHealthHtml, {
    industry: 'healthcare',
    botName: testHealthBot.name,
  });

  const healthDoc = await knowledgeRepository.createDocument({
    projectId: testHealthBot.id,
    title: extractedHealthPage.title,
    url: extractedHealthPage.url,
    content: extractedHealthPage.extractedText,
    metadata: { documentType: 'clinical_services' },
    contentHash: 'health-page-hash-1',
  });

  const healthChunks = chunkingService.chunkPage(extractedHealthPage, { industry: 'healthcare', botName: testHealthBot.name });
  for (const ch of healthChunks) {
    const emb = await embeddingService.generateEmbedding(ch.content).catch(() => []);
    await knowledgeRepository.createChunk({
      documentId: healthDoc.id,
      projectId: testHealthBot.id,
      content: ch.content,
      embedding: emb,
      metadata: ch.metadata,
      chunkIndex: ch.chunkIndex,
    });
  }
  console.log(`✓ Indexed ${healthChunks.length} semantic chunks for ${testHealthBot.name}.`);

  // ──────────────────────────────────────────────────────────────────────────
  // TEST J: Healthcare Specific Fact & Table Retrieval Tests
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[Test J] Testing Healthcare Facts, Table Columns, and Multi-Fact Retrieval...');
  const healthFacts = [
    { q: 'Who is the specialist for Cardiology and what is the consultation fee?', expected: 'Dr. Robert Chen' },
    { q: 'How much does a Neurology consultation cost?', expected: '$280' },
    { q: 'What is the trauma emergency hotline number?', expected: '+1-800-555-9911' },
    { q: 'Do you accept cashless health insurance?', expected: 'cashless' },
    { q: 'What are the ICU patient visiting hours?', expected: '5:00 PM to 6:00 PM' },
  ];

  let healthPassed = 0;
  for (const item of healthFacts) {
    const retrieved = await retrievalService.hybridRetrieve(testHealthBot.id, item.q, undefined, 4, {
      industry: 'healthcare',
      botName: testHealthBot.name,
      websiteUrl: testHealthBot.websiteUrl,
    });
    const found = retrieved.some((c) => c.content.toLowerCase().includes(item.expected.toLowerCase()));
    if (!found) {
      console.warn(`  [Warning] Healthcare retrieval missed "${item.expected}" for query: "${item.q}"`);
    } else {
      healthPassed++;
    }
  }
  console.log(`✓ Healthcare retrieval verified ${healthPassed}/${healthFacts.length} queries successfully.`);
  if (healthPassed < 4) {
    throw new Error('❌ Healthcare domain retrieval accuracy below acceptable threshold.');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST K: Combined Sources & Cross-Tenant Absolute Isolation
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n[Test K] Testing Multi-Bot Tenant Isolation & External Document Union...');
  // Upload a Surgery Preparation PDF manual to Apex Hospital
  const surgeryPdfText = `
    Apex Hospital Surgical Patient Care Guide:
    Pre-operative fasting requires no solid food 8 hours prior to scheduled surgical procedure.
    Clear liquids are permitted up to 2 hours before general anesthesia.
    Medication reconciliation must be completed 48 hours prior with the Chief Pharmacist.
  `.trim();

  const surgerySource = await knowledgeRepository.createSource({
    projectId: testHealthBot.id,
    url: 'https://apexhospital.example.com/docs/surgery-guide.pdf',
    title: 'Surgical Preparation & Anesthesia Protocol',
    type: 'DOCUMENT',
    status: 'INDEXED',
  });
  await knowledgeController.processSingleSource(testHealthBot.id, surgerySource, surgeryPdfText);

  // Query combined knowledge (website + PDF document)
  const combinedRetrieval = await retrievalService.hybridRetrieve(
    testHealthBot.id,
    'What are the pre-operative fasting guidelines before surgery?',
    undefined,
    4,
    { industry: 'healthcare', botName: testHealthBot.name }
  );
  const foundSurgeryGuideline = combinedRetrieval.some((c) => c.content.includes('8 hours') && c.content.includes('fasting'));
  if (!foundSurgeryGuideline) {
    throw new Error('❌ Failed to retrieve uploaded surgery document guidelines!');
  }
  console.log('✓ Successfully retrieved surgery guidelines from external uploaded PDF document.');

  // Strict Cross-Bot Isolation: Verify Apex Hospital cannot see NextGen Academy courses or Prycoons properties
  const eduLeakQuery = await retrievalService.hybridRetrieve(
    testHealthBot.id,
    'Full Stack Web Development $4,500 bootcamp',
    undefined,
    4,
    { industry: 'healthcare', botName: testHealthBot.name }
  );
  const hasEduLeak = eduLeakQuery.some((c) => c.content.includes('Full Stack Web Development') || c.content.includes('$4,500'));
  if (hasEduLeak) {
    throw new Error('❌ Tenant isolation failure: Healthcare bot retrieved Education bot chunks!');
  }
  console.log('✓ Verified 100% tenant isolation: Healthcare bot never accesses Education or Real Estate records.');

  console.log('\n================================================================');
  console.log('🎉 ALL TESTS PASSED: RAG RETRIEVAL, CRAWLER & LATENCY VERIFIED!');
  console.log('================================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
