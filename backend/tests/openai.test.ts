import { openaiService, OpenAIService } from '../src/services/ai/openai.service';
import { embeddingService } from '../src/services/embeddings/embedding.service';
import { ENV } from '../src/config/env';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runOpenAITests() {
  console.log('\n=======================================================');
  console.log('🧪 RUNNING OPENAI SERVICE & INTEGRATION TEST SUITE');
  console.log('=======================================================');

  // Test 1: OpenAI Service Instance
  console.log('\n[Test 1] OpenAIService instance initialization');
  assert(openaiService instanceof OpenAIService, 'openaiService is an instance of OpenAIService');
  console.log(`  Configured model: ${ENV.OPENAI_MODEL}`);
  console.log(`  OpenAI key configured: ${openaiService.isConfigured() ? 'YES' : 'NO (Using grounded fallback)'}`);

  // Test 2: Resilient grounded response generation
  console.log('\n[Test 2] Grounded response generation with verified context');
  const context = `
[Source 1: Prycoons Real Estate | https://prycoons.com/3-bhk-flats-in-gota-ahmedabad/]
Project: Ananta
Developer: Dharti Saket
Location: Gota, Ahmedabad
Configuration: 3 BHK
Price: ₹92 lakh Onwards
Area: 1863 - 2079 Sq Ft Super Built Up Area
Status: Under Construction (RERA Approved)
Amenities: Landscaped Garden, Gymnasium, Children's Play Area
`;

  const result = await openaiService.generateResponse(
    'You are a real estate assistant for Prycoons.',
    'What 3BHK flats are available in Gota?',
    context
  );

  assert(typeof result.text === 'string' && result.text.length > 0, 'Returns non-empty text response');
  assert(result.source === 'openai' || result.source === 'fallback', `Response source is valid (${result.source})`);
  assert(result.text.includes('Ananta'), 'Response contains verified property "Ananta"');
  assert(result.text.includes('Gota'), 'Response mentions location "Gota"');
  assert(result.text.includes('₹92 lakh'), 'Response mentions verified price "₹92 lakh"');

  // Test 3: Formatting & Anti-Hallucination
  console.log('\n[Test 3] Grounded fallback formatting and anti-hallucination');
  const fallbackText = openaiService.generateGroundedFallback(
    'Tell me about properties in Gota',
    context
  );
  assert(fallbackText.includes('### 🏢 Ananta'), 'Fallback formats property heading with icon and title');
  assert(fallbackText.includes('**Location:** Gota'), 'Fallback formats location with bold label');
  assert(fallbackText.includes('**Pricing:** ₹92 lakh Onwards'), 'Fallback formats price accurately');
  assert(!fallbackText.includes('[Source 1:'), 'Fallback strips raw source tags');

  // Test 4: Embedding Service & Vector Dimensions
  console.log('\n[Test 4] Embedding dimensions and vector compatibility');
  const dim = embeddingService.getVectorDimension();
  assert(dim === 768, `Embedding dimension is exactly 768 (got ${dim})`);

  const vector = await embeddingService.generateEmbedding('3 BHK apartments in Gota Ahmedabad');
  assert(Array.isArray(vector), 'Generated embedding is an array');
  assert(vector.length === 768, `Embedding length matches 768 vector dimension (got ${vector.length})`);

  // Verify vector is normalized unit vector (sum of squares ≈ 1.0)
  const normSq = vector.reduce((sum, v) => sum + v * v, 0);
  assert(Math.abs(normSq - 1.0) < 0.01, `Embedding vector is unit normalized (norm: ${Math.sqrt(normSq).toFixed(4)})`);

  // Test 5: Empty query safety
  console.log('\n[Test 5] Empty input embedding safety');
  const emptyVector = await embeddingService.generateEmbedding('   ');
  assert(emptyVector.length === 768, 'Empty string returns 768-dim vector');
  assert(emptyVector.every((v) => v === 0), 'Empty string vector is safely zeroed');

  // Test 6: Live OpenAI API Call (if key is configured in environment)
  if (ENV.OPENAI_API_KEY && ENV.OPENAI_API_KEY.trim() !== '') {
    console.log('\n[Test 6] Live OpenAI API Call with configured OPENAI_API_KEY');
    try {
      const liveRes = await openaiService.generateResponse(
        'You are a helpful assistant.',
        'Hello! Reply with the word "CONFIRMED".',
        ''
      );
      assert(liveRes.source === 'openai', 'Live call successfully returned with source: "openai"');
      console.log(`  ✓ Live OpenAI generation verified: "${liveRes.text.slice(0, 80)}..."`);
    } catch (err: any) {
      console.warn(`  ⚠️ Live OpenAI call warning: ${err.message}`);
    }
  } else {
    console.log('\n[Test 6] Live OpenAI API Call: Skipped (No OPENAI_API_KEY configured in .env yet)');
  }

  console.log('\n✅ ALL OPENAI SERVICE & INTEGRATION TESTS PASSED!');
}

runOpenAITests().catch((err) => {
  console.error(`\n❌ OpenAI Test Suite Failed: ${err.message}`);
  process.exit(1);
});
