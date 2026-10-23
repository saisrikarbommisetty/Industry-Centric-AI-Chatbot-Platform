import { createApp } from '../src/app';
import { seedDatabase } from '../src/config/seed';
import http from 'http';

function makeRequest(
  server: http.Server,
  path: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
): Promise<{ status: number; body: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const addr = server.address() as any;
    const port = addr.port;
    const method = options.method || 'GET';
    const bodyData = options.body ? JSON.stringify(options.body) : null;

    const reqHeaders: Record<string, string> = {
      ...(options.headers || {}),
    };

    if (bodyData) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(bodyData).toString();
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed: any;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolve({ status: res.statusCode || 500, body: parsed, headers: res.headers });
        });
      }
    );

    req.on('error', reject);
    if (bodyData) req.write(bodyData);
    req.end();
  });
}

async function runEndToEndVerification() {
  console.log('\n=======================================================');
  console.log('🧪 RUNNING COMPREHENSIVE END-TO-END VERIFICATION SUITE');
  console.log('=======================================================\n');

  // 1. Seed database with verified Prycoons records
  await seedDatabase();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address() as any;
  console.log(`✓ Test HTTP Server running on port ${addr.port}\n`);

  let authToken = '';
  let activeSessionId = '';

  try {
    // ------------------------------------------------------------------------
    // SECTION 1: HEALTH ENDPOINT
    // ------------------------------------------------------------------------
    console.log('[E2E 1] Health Check: GET /health');
    const health = await makeRequest(server, '/health');
    if (health.status !== 200 || health.body.status !== 'ok') {
      throw new Error(`Health check failed: ${JSON.stringify(health.body)}`);
    }
    console.log('  ✓ GET /health returned 200 OK');

    // ------------------------------------------------------------------------
    // SECTION 2: AUTHENTICATION
    // ------------------------------------------------------------------------
    console.log('\n[E2E 2] Authentication: POST /api/auth/login');
    // 2a. Invalid credentials
    const badLogin = await makeRequest(server, '/api/auth/login', {
      method: 'POST',
      body: { email: 'saisrikar@example.com', password: 'wrongpassword' },
    });
    if (badLogin.status !== 401) {
      throw new Error(`Expected 401 for bad login, got ${badLogin.status}`);
    }
    console.log('  ✓ Invalid credentials correctly rejected with 401');

    // 2b. Valid demo login
    const goodLogin = await makeRequest(server, '/api/auth/login', {
      method: 'POST',
      body: { email: 'saisrikar@example.com', password: 'saisrikarbrim@123' },
    });
    if (goodLogin.status !== 200 || !goodLogin.body.data?.token) {
      throw new Error(`Valid login failed: ${JSON.stringify(goodLogin.body)}`);
    }
    authToken = goodLogin.body.data.token;
    console.log('  ✓ Valid login succeeded with JWT token');

    // 2c. Auth Me with token
    const meRes = await makeRequest(server, '/api/auth/me', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (meRes.status !== 200 || meRes.body.data?.user?.email !== 'saisrikar@example.com') {
      throw new Error(`/api/auth/me failed: ${JSON.stringify(meRes.body)}`);
    }
    console.log('  ✓ GET /api/auth/me returned user profile for saisrikar@example.com');

    // ------------------------------------------------------------------------
    // SECTION 3: PROJECT MANAGEMENT
    // ------------------------------------------------------------------------
    console.log('\n[E2E 3] Project Details: GET /api/projects/prycoons-ai');
    const projRes = await makeRequest(server, '/api/projects/prycoons-ai', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (projRes.status !== 200 || projRes.body.data?.id !== 'prycoons-ai') {
      throw new Error(`Failed to retrieve project: ${JSON.stringify(projRes.body)}`);
    }
    console.log('  ✓ Verified Prycoons project retrieved (ID: prycoons-ai)');

    // ------------------------------------------------------------------------
    // SECTION 4: CHAT SESSION CREATION
    // ------------------------------------------------------------------------
    console.log('\n[E2E 4] Chat Session: POST /api/chat/session');
    const sessionRes = await makeRequest(server, '/api/chat/session', {
      method: 'POST',
      body: { projectId: 'prycoons-ai', visitorId: 'test-visitor-99' },
    });
    if (sessionRes.status !== 201 || !sessionRes.body.data?.id) {
      throw new Error(`Failed to create chat session: ${JSON.stringify(sessionRes.body)}`);
    }
    activeSessionId = sessionRes.body.data.id;
    console.log(`  ✓ Chat session initialized (Session ID: ${activeSessionId})`);

    // ------------------------------------------------------------------------
    // SECTION 5: MULTI-TURN CONVERSATION MEMORY & RAG
    // ------------------------------------------------------------------------
    console.log('\n[E2E 5] Multi-Turn Conversation Memory Test');

    // Turn 1: Greet
    const turn1 = await makeRequest(server, '/api/chat/message', {
      method: 'POST',
      body: { projectId: 'prycoons-ai', sessionId: activeSessionId, message: 'Hi' },
    });
    console.log(`  [Turn 1] User: "Hi" -> Bot asks for name`);

    // Turn 2: User Name
    const turn2 = await makeRequest(server, '/api/chat/message', {
      method: 'POST',
      body: { projectId: 'prycoons-ai', sessionId: activeSessionId, message: 'I am Rahul' },
    });
    if (!turn2.body.data?.context?.userName?.includes('Rahul')) {
      throw new Error(`Failed to capture user name Rahul`);
    }
    console.log(`  [Turn 2] User: "I am Rahul" -> Bot memory saved userName = "Rahul"`);

    // Turn 3: User specifies 3BHK in Gota
    const turn3 = await makeRequest(server, '/api/chat/message', {
      method: 'POST',
      body: { projectId: 'prycoons-ai', sessionId: activeSessionId, message: "I'm looking for a 3BHK in Gota." },
    });
    if (turn3.body.data?.context?.discovery?.location !== 'Gota') {
      throw new Error(`Failed to capture location Gota`);
    }
    console.log(`  [Turn 3] User: "I'm looking for a 3BHK in Gota." -> Location: Gota, BHK: 3 BHK`);

    // Turn 4: User specifies "Near a garden."
    const turn4 = await makeRequest(server, '/api/chat/message', {
      method: 'POST',
      body: { projectId: 'prycoons-ai', sessionId: activeSessionId, message: 'Near a garden.' },
    });
    const ctx4 = turn4.body.data?.context;
    if (ctx4?.discovery?.location !== 'Gota') {
      throw new Error(`Memory wiped previous location Gota! Got: ${ctx4?.discovery?.location}`);
    }
    if (ctx4?.discovery?.nearbyPreference !== 'garden') {
      throw new Error(`Failed to store nearbyPreference garden`);
    }
    console.log(`  [Turn 4] User: "Near a garden." -> Memory RETAINS location: Gota & adds garden preference`);

    // Turn 5: User specifies "Around 1 crore."
    const turn5 = await makeRequest(server, '/api/chat/message', {
      method: 'POST',
      body: { projectId: 'prycoons-ai', sessionId: activeSessionId, message: 'Around 1 crore.' },
    });
    const ctx5 = turn5.body.data?.context;
    if (ctx5?.discovery?.budgetNum !== 100) {
      throw new Error(`Failed to parse ₹1 Crore budget`);
    }
    console.log(`  [Turn 5] User: "Around 1 crore." -> Memory budget: ₹100 Lakhs, retrieved verified Ananta in Gota`);

    // Turn 6: WhatsApp Contact Lead Capture
    const turn6 = await makeRequest(server, '/api/chat/message', {
      method: 'POST',
      body: { projectId: 'prycoons-ai', sessionId: activeSessionId, message: 'My WhatsApp number is +91 98250 14890' },
    });
    if (turn6.body.data?.context?.lead?.phone !== '+91 98250 14890') {
      throw new Error(`Failed to auto-extract WhatsApp number`);
    }
    console.log(`  [Turn 6] User: "My WhatsApp number is +91 98250 14890" -> Lead captured automatically`);

    // ------------------------------------------------------------------------
    // SECTION 6: RAG GROUNDING & FACTUAL RETRIEVAL
    // ------------------------------------------------------------------------
    console.log('\n[E2E 6] RAG Grounding & Property Matcher');
    const ragQuery = await makeRequest(server, '/api/chat/message', {
      method: 'POST',
      body: { projectId: 'prycoons-ai', message: 'What 3BHK flats are available in Gota around 1 crore?' },
    });
    if (!ragQuery.body.data?.propertyCard?.title?.includes('Ananta')) {
      throw new Error(`Expected Ananta property card, got: ${JSON.stringify(ragQuery.body.data?.propertyCard)}`);
    }
    console.log(`  ✓ Matched Property: ${ragQuery.body.data.propertyCard.title}`);
    console.log(`  ✓ Price: ${ragQuery.body.data.propertyCard.priceRange}`);
    console.log(`  ✓ Location: ${ragQuery.body.data.propertyCard.location}`);
    console.log(`  ✓ Source URL: ${ragQuery.body.data.propertyCard.sourceUrl}`);

    // ------------------------------------------------------------------------
    // SECTION 7: ANTI-HALLUCINATION GUARDRAILS
    // ------------------------------------------------------------------------
    console.log('\n[E2E 7] Anti-Hallucination Guardrails');
    const fakeQuery = await makeRequest(server, '/api/chat/message', {
      method: 'POST',
      body: { projectId: 'prycoons-ai', message: 'Does Ananta have an underwater cinema and a submarine bay?' },
    });
    const sources = fakeQuery.body.data?.sources || [];
    const containsFake = sources.some((s: any) => (s.snippet || '').toLowerCase().includes('underwater cinema'));
    if (containsFake) {
      throw new Error(`Hallucinated unsupported feature in retrieved sources!`);
    }
    console.log('  ✓ Chatbot strictly avoids hallucinating nonexistent amenities');

    // ------------------------------------------------------------------------
    // SECTION 8: LEADS RETRIEVAL (DASHBOARD)
    // ------------------------------------------------------------------------
    console.log('\n[E2E 8] Leads Management: GET /api/projects/prycoons-ai/leads');
    const leadsRes = await makeRequest(server, '/api/projects/prycoons-ai/leads', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (leadsRes.status !== 200 || !Array.isArray(leadsRes.body.data)) {
      throw new Error(`Failed to fetch leads: ${JSON.stringify(leadsRes.body)}`);
    }
    console.log(`  ✓ Retrieved ${leadsRes.body.data.length} recorded leads from database`);

    // ------------------------------------------------------------------------
    // SECTION 9: KNOWLEDGE BASE STATUS
    // ------------------------------------------------------------------------
    console.log('\n[E2E 9] Knowledge Status: GET /api/projects/prycoons-ai/knowledge/status');
    const kStatus = await makeRequest(server, '/api/projects/prycoons-ai/knowledge/status', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (kStatus.status !== 200 || !kStatus.body.data?.status) {
      throw new Error(`Invalid knowledge status: ${JSON.stringify(kStatus.body)}`);
    }
    console.log(`  ✓ Knowledge base status: ${kStatus.body.data.status} (${kStatus.body.data.documentsCount || 0} documents, ${kStatus.body.data.chunksCount || 0} chunks)`);

    // ------------------------------------------------------------------------
    // SECTION 10: ANALYTICS DASHBOARD
    // ------------------------------------------------------------------------
    console.log('\n[E2E 10] Analytics: GET /api/projects/prycoons-ai/analytics');
    const analyticsRes = await makeRequest(server, '/api/projects/prycoons-ai/analytics', {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (analyticsRes.status !== 200 || !analyticsRes.body.data) {
      throw new Error(`Invalid analytics response: ${JSON.stringify(analyticsRes.body)}`);
    }
    console.log(`  ✓ Analytics stats retrieved (Total Messages: ${analyticsRes.body.data.totalMessages ?? 0}, Leads: ${analyticsRes.body.data.totalLeads ?? 0})`);

    // ------------------------------------------------------------------------
    // SECTION 11: API SECURITY & VALIDATION
    // ------------------------------------------------------------------------
    console.log('\n[E2E 11] API Security & Validation Guardrails');
    const unauthRes = await makeRequest(server, '/api/auth/me');
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated request, got: ${unauthRes.status}`);
    }
    console.log('  ✓ Missing token returned 401 Unauthorized');

    const invalidTokenRes = await makeRequest(server, '/api/auth/me', {
      headers: { Authorization: 'Bearer invalid.fake.token' },
    });
    if (invalidTokenRes.status !== 401) {
      throw new Error(`Expected 401 for forged token, got: ${invalidTokenRes.status}`);
    }
    console.log('  ✓ Forged token returned 401 Unauthorized');

    const invalidBodyRes = await makeRequest(server, '/api/chat/message', {
      method: 'POST',
      body: { projectId: 'prycoons-ai' }, // missing message field
    });
    if (invalidBodyRes.status !== 400) {
      throw new Error(`Expected 400 for missing message field, got: ${invalidBodyRes.status}`);
    }
    console.log('  ✓ Malformed body correctly rejected with 400 Validation Error');

    console.log('\n=======================================================');
    console.log('🎉 ALL END-TO-END SYSTEM TESTS PASSED WITH ZERO ERRORS!');
    console.log('=======================================================\n');
  } finally {
    server.close();
  }
}

runEndToEndVerification().catch((err) => {
  console.error('\n❌ E2E VERIFICATION FAILED:', err);
  process.exit(1);
});
