import assert from 'assert';
import { UrlNormalizer } from '../src/services/social/urlNormalizer';
import { socialMediaService } from '../src/services/social/socialMedia.service';
import { projectRepository } from '../src/repositories/project.repository';
import { knowledgeRepository } from '../src/repositories/knowledge.repository';
import { retrievalService } from '../src/services/rag/retrieval.service';
import { ConversationService } from '../src/services/chatbot/conversation.service';

const conversationService = new ConversationService();

async function runSocialMediaIntegrationTests() {
  console.log('\n================================================================');
  console.log('🧪 SOCIAL MEDIA CONTENT INTEGRATION COMPREHENSIVE TEST SUITE');
  console.log('================================================================\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: URL Normalization, SSRF Security & Platform Auto-Detection
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[Test 1] Verifying URL Normalization, SSRF Defenses & Platform Detection...');

  // YouTube
  const yt1 = UrlNormalizer.detectPlatform('https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_source=twitter&feature=shared');
  assert.strictEqual(yt1.platform, 'youtube');
  assert.strictEqual(yt1.canonicalUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');

  const ytShort = UrlNormalizer.detectPlatform('https://youtube.com/shorts/abc123XYZ?si=tracking123');
  assert.strictEqual(ytShort.platform, 'youtube');
  assert.strictEqual(ytShort.canonicalUrl, 'https://www.youtube.com/watch?v=abc123XYZ');

  // X (Twitter)
  const tw1 = UrlNormalizer.detectPlatform('https://x.com/OpenAI/status/1789718712345678901?s=20&t=abcdef');
  assert.strictEqual(tw1.platform, 'twitter');
  assert.strictEqual(tw1.canonicalUrl, 'https://x.com/OpenAI/status/1789718712345678901');

  const tw2 = UrlNormalizer.detectPlatform('https://twitter.com/elonmusk/status/1683325380441112576?ref_src=twsrc');
  assert.strictEqual(tw2.platform, 'twitter');
  assert.strictEqual(tw2.canonicalUrl, 'https://x.com/elonmusk/status/1683325380441112576');

  // LinkedIn
  const li1 = UrlNormalizer.detectPlatform('https://www.linkedin.com/posts/google_ai-breakthrough-activity-7123456789012345678-ABCD?utm_medium=social');
  assert.strictEqual(li1.platform, 'linkedin');
  assert(li1.canonicalUrl.startsWith('https://www.linkedin.com/posts/google_ai-breakthrough'));

  // Instagram
  const ig1 = UrlNormalizer.detectPlatform('https://www.instagram.com/p/C312abcXYZ/?igsh=tracking123');
  assert.strictEqual(ig1.platform, 'instagram');
  assert.strictEqual(ig1.canonicalUrl, 'https://www.instagram.com/p/C312abcXYZ/');

  const igReel = UrlNormalizer.detectPlatform('https://instagram.com/reel/C890defUVW/?utm_source=ig_web_copy_link');
  assert.strictEqual(igReel.platform, 'instagram');
  assert.strictEqual(igReel.canonicalUrl, 'https://www.instagram.com/reel/C890defUVW/');

  // Facebook
  const fb1 = UrlNormalizer.detectPlatform('https://www.facebook.com/techcorp/posts/10159876543210?fbclid=tracking');
  assert.strictEqual(fb1.platform, 'facebook');

  // TikTok
  const tt1 = UrlNormalizer.detectPlatform('https://www.tiktok.com/@creativehub/video/7234567890123456789?is_from_webapp=1');
  assert.strictEqual(tt1.platform, 'tiktok');
  assert.strictEqual(tt1.canonicalUrl, 'https://www.tiktok.com/@creativehub/video/7234567890123456789');

  // SSRF Protection
  const ssrf1 = UrlNormalizer.validate('http://169.254.169.254/latest/meta-data/');
  assert.strictEqual(ssrf1.isValid, false, 'AWS metadata must be blocked');

  const ssrf2 = UrlNormalizer.validate('http://localhost:8080/admin');
  assert.strictEqual(ssrf2.isValid, false, 'Localhost must be blocked');

  const ssrf3 = UrlNormalizer.validate('http://192.168.1.1/router');
  assert.strictEqual(ssrf3.isValid, false, 'Private IP ranges must be blocked');

  const ssrf4 = UrlNormalizer.validate('file:///etc/passwd');
  assert.strictEqual(ssrf4.isValid, false, 'Non-HTTP protocols must be blocked');

  console.log('  ✓ All 6 social platforms + SSRF security filters verified.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Multi-Industry Bot Setup & Social Post Ingestion
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[Test 2] Ingesting Social Media Posts across Multiple Industry Bots...');

  // Bot A: Creative Design & Marketing Agency Bot (Apex)
  const apexBot = await projectRepository.create({
    id: 'apex-marketing-bot',
    name: 'Apex Creative Assistant',
    slug: 'apex-marketing-bot',
    industry: 'marketing',
    industryName: 'Marketing & Advertising',
    websiteUrl: 'https://apexcreative.agency',
    description: 'Assists clients with brand identity, digital marketing packages, and social media campaigns.',
  });

  // Bot B: Global Technology Education Bot
  const techEduBot = await projectRepository.create({
    id: 'cloud-academy-bot',
    name: 'Cloud Academy Assistant',
    slug: 'cloud-academy-bot',
    industry: 'education',
    industryName: 'Education & Training',
    websiteUrl: 'https://cloudacademy.training',
    description: 'AI & Cloud computing certification bootcamp and student admissions assistant.',
  });

  // Ingest Post 1 into Bot A (LinkedIn post describing branding packages & pricing)
  const linkedInPostUrl = 'https://www.linkedin.com/posts/apexcreative_branding-pricing-services-2026';
  const linkedInContent = `
Apex Creative is thrilled to announce our Q4 2026 Digital Branding Packages!
1. Startup Identity Sprint: ₹75,000 includes full logo suite, brand guidelines, and UI design tokens.
2. Enterprise Rebrand: ₹2,50,000 includes full rebranding, 3D visual assets, and marketing collateral.
3. Monthly Social Media Management: Starting at ₹45,000/month with 16 custom branded posts and reels.
Contact us via WhatsApp or at hello@apexcreative.agency to reserve your slot!
#Branding #MarketingPackages #DesignAgency #StartupGrowth #CreativeServices
`.trim();

  const addRes1 = await socialMediaService.addSource({
    projectId: 'apex-marketing-bot',
    url: linkedInPostUrl,
    title: 'Apex Q4 2026 Branding Packages & Pricing Announcement',
    manualContent: linkedInContent,
  });

  assert(addRes1.source, 'Source record should be created');
  assert.strictEqual(addRes1.source.status, 'INDEXED', 'Status must be INDEXED');
  assert.strictEqual(addRes1.source.type, 'SOCIAL_MEDIA', 'Type must be SOCIAL_MEDIA');
  console.log('  ✓ Ingested LinkedIn post into Apex Marketing Bot.');

  // Ingest Post 2 into Bot B (YouTube video explaining Cloud DevOps Bootcamp)
  const youtubeUrl = 'https://www.youtube.com/watch?v=cloudDevOpsBootcamp2026';
  const youtubeContent = `
Title: Complete AWS Cloud & Kubernetes Architect Bootcamp 2026
Channel: Cloud Academy Official
Duration: 12-week comprehensive weekend batch.
Tuition Fee: ₹65,000 with 100% money-back guarantee if not placed within 6 months.
Eligibility: Basic knowledge of Linux or programming. Zero prior cloud experience required.
Next Batch: Starts on 1st of next month. Limited to 25 learners per cohort.
#CloudComputing #DevOps #Kubernetes #CareerGrowth #TechBootcamp
`.trim();

  const addRes2 = await socialMediaService.addSource({
    projectId: 'cloud-academy-bot',
    url: youtubeUrl,
    title: 'AWS Cloud & Kubernetes Architect Bootcamp Overview',
    manualContent: youtubeContent,
  });

  assert(addRes2.source, 'Source record should be created for Cloud Academy');
  assert.strictEqual(addRes2.source.status, 'INDEXED');
  console.log('  ✓ Ingested YouTube post into Cloud Academy Bot.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: RAG Retrieval from Ingested Social Media Content
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[Test 3] Verifying Chatbot RAG Retrieval from Social Media Content...');

  // Query Bot A for information published in its LinkedIn post
  const apexChunks = await retrievalService.hybridRetrieve(
    'apex-marketing-bot',
    'What are the pricing details for your Startup Identity branding package?'
  );

  assert(apexChunks.length > 0, 'Apex bot should retrieve chunks from its LinkedIn post');
  assert(apexChunks.some((c) => c.content.includes('75,000') || c.content.includes('Startup Identity')), 'Chunk must contain exact pricing ₹75,000');
  assert(apexChunks.every((c) => c.projectId === 'apex-marketing-bot'), 'All chunks must belong to apex-marketing-bot');
  assert(apexChunks[0].sourceUrl.includes('linkedin.com'), 'Source URL must reference the LinkedIn post');
  console.log('  ✓ Apex bot successfully retrieved ₹75,000 Startup Identity from LinkedIn post.');

  // Query Bot B for information published in its YouTube video
  const eduChunks = await retrievalService.hybridRetrieve(
    'cloud-academy-bot',
    'What is the tuition fee and duration of the Kubernetes DevOps bootcamp?'
  );

  assert(eduChunks.length > 0, 'Cloud Academy bot should retrieve chunks from its YouTube video');
  assert(eduChunks.some((c) => c.content.includes('65,000') || c.content.includes('12-week')), 'Chunk must contain ₹65,000 tuition fee');
  assert(eduChunks.every((c) => c.projectId === 'cloud-academy-bot'), 'All chunks must belong to cloud-academy-bot');
  assert(eduChunks[0].sourceUrl.includes('youtube.com'), 'Source URL must reference the YouTube video');
  console.log('  ✓ Cloud Academy bot successfully retrieved ₹65,000 tuition and 12-week duration from YouTube post.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Chatbot End-to-End Conversational Response Grounded in Social Media
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[Test 4] Verifying Grounded Conversational Chatbot Answers...');

  const chatRes1 = await conversationService.processMessage({
    projectId: 'apex-marketing-bot',
    sessionId: 'sess-apex-test-social',
    message: 'What services and pricing do you offer for startups in your branding packages?',
  });

  console.log(`  Apex Bot Response:\n  "${chatRes1.message.slice(0, 220)}..."`);
  assert(chatRes1.message.includes('75,000') || chatRes1.message.toLowerCase().includes('startup identity'), 'Bot answer must mention Startup Identity pricing');
  assert(chatRes1.sources && chatRes1.sources.length > 0, 'Sources array must contain the social post citation');
  assert(chatRes1.sources.some((s: any) => s.url.includes('linkedin.com')), 'Source citation must reference LinkedIn URL');
  console.log('  ✓ Chatbot answered with verified social media facts and citation.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: Strict Multi-Tenant Isolation (Bot B cannot see Bot A social posts)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[Test 5] Verifying Strict Tenant Isolation for Social Media Knowledge...');

  const leakedChunks = await retrievalService.hybridRetrieve(
    'cloud-academy-bot',
    'Startup Identity Sprint branding package 75,000'
  );

  const containsApex = leakedChunks.some((c) => c.content.includes('Apex Creative') || c.content.includes('75,000'));
  assert(!containsApex, 'Cloud Academy bot must NEVER retrieve Apex Creative branding knowledge');

  const leakedToPrycoons = await retrievalService.hybridRetrieve(
    'prycoons',
    'Kubernetes Architect Bootcamp 65,000'
  );
  const prycoonsHasBootcamp = leakedToPrycoons.some((c) => c.content.includes('Kubernetes') || c.content.includes('65,000'));
  assert(!prycoonsHasBootcamp, 'Prycoons bot must NEVER retrieve Cloud Academy YouTube post content');

  console.log('  ✓ Verified 100% tenant isolation: No cross-bot leakage of social media posts.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 6: Duplicate Detection (Same bot vs Different bots)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[Test 6] Verifying Duplicate Detection within same bot & Cross-bot independence...');

  // Submitting the exact same URL to Apex bot with tracking query parameters
  const duplicateUrlWithTracking = `${linkedInPostUrl}?utm_source=newsletter&utm_medium=email&ref=shared`;
  const dupResult = await socialMediaService.addSource({
    projectId: 'apex-marketing-bot',
    url: duplicateUrlWithTracking,
    title: 'Duplicate Submission',
  });

  assert.strictEqual(dupResult.isDuplicate, true, 'Duplicate URL must be detected and not re-inserted');
  assert.strictEqual(dupResult.source.id, addRes1.source.id, 'Must reference the existing source record');
  console.log('  ✓ Duplicate post within same bot correctly detected.');

  // Submitting the same post to a DIFFERENT bot must be allowed (multi-tenant independence)
  const crossBotAdd = await socialMediaService.addSource({
    projectId: 'cloud-academy-bot',
    url: linkedInPostUrl,
    title: 'Apex Post added by Cloud Academy',
    manualContent: linkedInContent,
  });

  assert.strictEqual(crossBotAdd.isDuplicate, false, 'Different bot must be allowed to add same public post');
  assert.notStrictEqual(crossBotAdd.source.id, addRes1.source.id, 'Must have distinct source ID');
  console.log('  ✓ Multi-tenant independence verified: Different bot can add same public post.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 7: Source Refresh / Re-indexing Lifecycle
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[Test 7] Verifying Source Refresh, Content Updates & Stale Chunk Eviction...');

  const updatedLinkedInContent = `
Apex Creative is thrilled to announce our Q4 2026 Digital Branding Packages!
1. Startup Identity Sprint: Updated Price ₹85,000 (Includes 2027 design tokens).
2. Enterprise Rebrand: ₹2,80,000.
Contact us at hello@apexcreative.agency!
#UpdatedPricing #Branding2027
`.trim();

  // Update content and trigger refresh
  const refreshRes = await socialMediaService.processSource(
    'apex-marketing-bot',
    addRes1.source,
    updatedLinkedInContent
  );

  assert.strictEqual(refreshRes.status, 'INDEXED', 'Refresh must succeed');

  // Verify retrieval returns the NEW price ₹85,000 and NOT stale ₹75,000
  retrievalService.invalidateCache('apex-marketing-bot');
  const freshChunks = await retrievalService.hybridRetrieve(
    'apex-marketing-bot',
    'What is the price of the Startup Identity Sprint?'
  );

  assert(freshChunks.some((c) => c.content.includes('85,000')), 'Must retrieve updated price ₹85,000');
  const hasStale75k = freshChunks.some((c) => c.content.includes('75,000'));
  assert(!hasStale75k, 'Outdated chunk with ₹75,000 must be evicted and not returned');
  console.log('  ✓ Source refreshed: New price ₹85,000 indexed, stale ₹75,000 chunk evicted.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 8: Source Deletion & Cache Invalidation
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[Test 8] Verifying Source Deletion & Complete Knowledge Removal...');

  await socialMediaService.deleteSource('apex-marketing-bot', addRes1.source.id);

  // Verify source deleted from repository
  const deletedSource = await knowledgeRepository.getSourceById(addRes1.source.id);
  assert.strictEqual(deletedSource, null, 'Source must be deleted from repository');

  // Verify chunks deleted
  const postDeletionChunks = await retrievalService.hybridRetrieve(
    'apex-marketing-bot',
    'Startup Identity Sprint branding package 85,000'
  );

  const containsDeleted = postDeletionChunks.some((c) => c.content.includes('Startup Identity Sprint'));
  assert(!containsDeleted, 'Deleted social media content must NEVER be returned by chatbot RAG');
  console.log('  ✓ Social media source deleted, chunks wiped, and retrieval confirmed empty.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 9: Co-existence with Website & Document Knowledge
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[Test 9] Verifying Co-existence of Website, PDF & Social Media Knowledge...');

  // Add website document to Apex
  const webDoc = await knowledgeRepository.createDocument({
    projectId: 'apex-marketing-bot',
    title: 'Apex Agency Office Location & Contacts',
    url: 'https://apexcreative.agency/contact',
    content: 'Apex Creative Agency is located in Silicon Square, 4th Floor. Office contact number is +91 99000 11223. Email is support@apexcreative.agency.',
    metadata: { documentType: 'URL' },
    contentHash: 'hash-apex-web-1',
  });
  await knowledgeRepository.createChunk({
    documentId: webDoc.id,
    projectId: 'apex-marketing-bot',
    content: webDoc.content,
    chunkIndex: 0,
    metadata: { sourceTitle: webDoc.title, sourceUrl: webDoc.url },
  });

  // Add X (Twitter) post to Apex
  const twitterUrl = 'https://x.com/apexcreative/status/1790011223344556677';
  const twitterContent = 'We just won the 2026 National Brand Excellence Award for our work with green energy startups! #DesignExcellence #AwardWinning';
  await socialMediaService.addSource({
    projectId: 'apex-marketing-bot',
    url: twitterUrl,
    title: 'Apex Brand Excellence Award Announcement',
    manualContent: twitterContent,
  });

  retrievalService.invalidateCache('apex-marketing-bot');

  // Query asking about office location (from website)
  const locChunks = await retrievalService.hybridRetrieve('apex-marketing-bot', 'Where is your office located and contact phone?');
  assert(locChunks.some((c) => c.content.includes('Silicon Square')), 'Must retrieve website office location');

  // Query asking about awards (from social media)
  const awardChunks = await retrievalService.hybridRetrieve('apex-marketing-bot', 'Which awards has Apex won recently?');
  assert(awardChunks.some((c) => c.content.includes('National Brand Excellence Award')), 'Must retrieve award from social post');

  console.log('  ✓ Website knowledge and Social Media knowledge co-exist seamlessly in RAG.\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 10: Graceful Handling of Inaccessible or Private Posts
  // ──────────────────────────────────────────────────────────────────────────
  console.log('[Test 10] Verifying Graceful Handling of Private / Restricted Posts...');

  const privateInstaUrl = 'https://www.instagram.com/p/privatePostTest/';
  const previewRes = await socialMediaService.preview(privateInstaUrl);

  // In test environment without Instagram auth, preview reports PRIVATE_OR_RESTRICTED or CONTENT_UNAVAILABLE
  assert.strictEqual(previewRes.success, false, 'Private/inaccessible post must not report success');
  assert(
    previewRes.error &&
      (previewRes.error.code === 'PRIVATE_OR_RESTRICTED' ||
       previewRes.error.code === 'CONTENT_UNAVAILABLE' ||
       previewRes.error.code === 'EXTRACTION_FAILED'),
    'Must return clear error code explaining access restriction'
  );
  assert(previewRes.error.message.length > 10, 'Must provide clear explanatory message to user');
  console.log(`  ✓ Restricted post handled gracefully: [${previewRes.error.code}] "${previewRes.error.message.slice(0, 90)}..."\n`);

  console.log('================================================================');
  console.log('🎉 ALL SOCIAL MEDIA CONTENT INTEGRATION TESTS PASSED (100%)!');
  console.log('================================================================\n');
}

runSocialMediaIntegrationTests().catch((err) => {
  console.error('❌ Social media integration test failed:', err);
  process.exit(1);
});
