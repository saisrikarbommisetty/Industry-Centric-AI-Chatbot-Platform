import { ConversationService } from '../src/services/chatbot/conversation.service';
import { connectDatabase } from '../src/config/database';

async function testConversation() {
  await connectDatabase();
  const conv = new ConversationService();

  console.log('\n=======================================================');
  console.log('🧪 TESTING CHATBOT REAL CONVERSATION RESPONSES');
  console.log('=======================================================\n');

  const queries = [
    'What 2 BHK flats are available in Gota?',
    'What 3 BHK flats are available in Gota Ahmedabad?',
  ];

  for (const q of queries) {
    console.log(`\n💬 USER ASKS: "${q}"`);
    console.log('-------------------------------------------------------');
    const result = await conv.processMessage({
      projectId: 'prycoons-ai',
      message: q,
    });
    console.log(`🤖 BOT RESPONSE:\n${result.message}`);
    console.log('-------------------------------------------------------');
  }
}

testConversation()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test error:', err);
    process.exit(1);
  });
