import { app } from '../src/app';
import http from 'http';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion Failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function request(serverUrl: string, method: string, path: string, body?: any, headers?: Record<string, string>) {
  const url = `${serverUrl}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runApiTests() {
  console.log('\n=======================================================');
  console.log('🧪 RUNNING API ENDPOINTS TEST SUITE');
  console.log('=======================================================');

  // Start temporary test server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Health Check
    console.log('\n[API 1] GET /health');
    const health = await request(baseUrl, 'GET', '/health');
    assert(health.status === 200, 'Health check returns status 200');
    assert(health.data.status === 'ok', 'Health response is ok');

    // 2. Demo User Login
    console.log('\n[API 2] POST /api/auth/login');
    const login = await request(baseUrl, 'POST', '/api/auth/login', {
      email: 'saisrikar@example.com',
      password: 'saisrikarbrim@123',
    });
    assert(login.status === 200, 'Demo login returns status 200');
    assert(login.data.data.token, 'JWT token generated');
    const token = login.data.data.token;

    // 3. Auth Me
    console.log('\n[API 3] GET /api/auth/me');
    const me = await request(baseUrl, 'GET', '/api/auth/me', undefined, {
      Authorization: `Bearer ${token}`,
    });
    assert(me.status === 200, 'Auth me returns user profile');
    assert(me.data.data.user.email === 'saisrikar@example.com', 'User email verified');

    // 4. Create Chat Session
    console.log('\n[API 4] POST /api/chat/session');
    const sess = await request(baseUrl, 'POST', '/api/chat/session', {
      projectId: 'prycoons-ai',
      visitorId: 'test-visitor-1',
    });
    assert(sess.status === 201, 'Chat session created with status 201');
    const sessionId = sess.data.data.id;

    // 5. Send Chat Message
    console.log('\n[API 5] POST /api/chat/message');
    const chat = await request(baseUrl, 'POST', '/api/chat/message', {
      projectId: 'prycoons-ai',
      sessionId,
      message: 'What 3BHK flats are available in Gota?',
    });
    assert(chat.status === 200, 'Chat message processed with status 200');
    assert(chat.data.data.message.length > 0, 'Assistant returned message');
    assert(chat.data.data.sources !== undefined, 'Sources metadata attached');

    // 6. Lead Capture API
    console.log('\n[API 6] POST /api/leads');
    const lead = await request(baseUrl, 'POST', '/api/leads', {
      projectId: 'prycoons-ai',
      sessionId,
      name: 'Rohan Shah',
      phone: '+91 99099 88776',
      email: 'rohan@example.com',
      intent: 'buying',
    });
    assert(lead.status === 201, 'Lead captured successfully');

    // 7. Get Project Knowledge Status
    console.log('\n[API 7] GET /api/projects/prycoons-ai/knowledge/status');
    const kStatus = await request(baseUrl, 'GET', '/api/projects/prycoons-ai/knowledge/status');
    assert(kStatus.status === 200, 'Knowledge status endpoint returns 200');

    console.log('\n✅ ALL API ENDPOINT TESTS PASSED!');
  } finally {
    server.close();
  }
}

runApiTests().catch((err) => {
  console.error(`\n❌ API Tests Failed: ${err.message}`);
  process.exit(1);
});
