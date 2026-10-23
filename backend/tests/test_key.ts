import OpenAI from 'openai';
import { ENV } from '../src/config/env';

async function testKey() {
  console.log('=======================================================');
  console.log('🔑 TESTING OPENAI API KEY & CONNECTIVITY');
  console.log(`🤖 Configured Model: ${ENV.OPENAI_MODEL}`);
  console.log('=======================================================');

  if (!ENV.OPENAI_API_KEY || ENV.OPENAI_API_KEY.trim() === '') {
    console.log('\n⚠️  No OPENAI_API_KEY found in backend/.env.');
    console.log('ℹ️  To test a real OpenAI API request:');
    console.log('   1. Open backend/.env');
    console.log('   2. Set OPENAI_API_KEY=your_company_openai_key');
    console.log('   3. Run: npm run test:key (or npx tsx tests/test_key.ts)\n');
    process.exit(0);
  }

  try {
    const openai = new OpenAI({ apiKey: ENV.OPENAI_API_KEY });

    const prompt = `You are representing Prycoons Real Estate. The user asked: "What 2 BHK flats are available in Gota?"
Retrieved website data:
Project: Shubh Green
Developer: Shubh Developers
Location: Gota, Ahmedabad
Configuration: 2 BHK
Price: ₹52 lakh Onwards
Area: 1260 - 1440 Sq Ft Super Built Up Area
Status: Ready to Move (RERA Approved)
Amenities: Landscaped Garden, Dedicated Parking, 24/7 Security

Project: Satyaa Heights
Developer: Satyaa Infracon
Location: Gota, Ahmedabad
Configuration: 2 BHK
Price: ₹58 lakh Onwards
Area: 1350 - 1530 Sq Ft Super Built Up Area
Status: Under Construction (RERA Approved)
Amenities: Clubhouse, Gym, EV Charging, Senior Citizen Sit-out

Please respond to the user neatly, warmly, and accurately based on the verified data above. Format property details with clean Markdown bullet points.`;

    const response = await openai.chat.completions.create({
      model: ENV.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a warm, helpful real estate assistant representing Prycoons Real Estate. Always base answers strictly on verified records.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 1000,
    });

    console.log('\n✅ OpenAI API Connection Succeeded!');
    console.log(`Model Used: ${response.model}`);
    console.log('\nResponse Output:\n');
    console.log(response.choices[0]?.message?.content);
    console.log('\n=======================================================\n');
  } catch (error: any) {
    console.error(`\n❌ OpenAI API Call Failed: ${error.message}`);
    process.exit(1);
  }
}

testKey();
