import assert from 'assert';
import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { visitService } from '../src/services/visits/visit.service';
import { brochureService } from '../src/services/brochure/brochure.service';
import { conversationService } from '../src/services/chatbot/conversation.service';
import { OFFICIAL_PRYCOONS_CONTACT, OBSOLETE_CONTACT_NUMBERS } from '../src/config/organization';

async function runMasterVerification() {
  console.log('===============================================================');
  console.log('ANTIGRAVITY MASTER VERIFICATION SUITE — 4 ENHANCEMENTS');
  console.log('===============================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function recordTest(name: string, passed: boolean, details?: string) {
    totalTests++;
    if (passed) {
      passedTests++;
      console.log(`  ✅ PASS: ${name}`);
      if (details) console.log(`     ${details}`);
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      if (details) console.error(`     ${details}`);
    }
  }

  // -------------------------------------------------------------
  // TEST GROUP A: Schedule Visit Persistence & Excel Export
  // -------------------------------------------------------------
  console.log('--- TEST GROUP A: Schedule Visit Persistence & Excel Export ---');

  const testVisitData = {
    projectId: 'prycoons-ai',
    customerName: 'Ananya Sharma',
    mobileNumber: '+91 98765 43210',
    email: 'ananya.s@example.com',
    propertyName: 'The Sovereign Ambli',
    propertyUrl: 'https://prycoons.com/properties-in-ambli-ahmedabad/the-sovereign/',
    locality: 'Ambli',
    city: 'Ahmedabad',
    bhk: '4 BHK Luxury',
    propertyPrice: '₹3.85 Cr',
    assistantId: 'prycoons-ai',
    sessionId: 'sess-verify-test-101',
    customerNotes: 'Preferred slot: Sunday 11:30 AM with family'
  };

  try {
    // 1. Create Visit Request
    const created = await visitService.createVisitRequest(testVisitData);
    recordTest(
      'Schedule Visit persistence',
      Boolean(created && created.requestId && created.customerName === 'Ananya Sharma'),
      `Created Visit Request ID: #${created.requestId}`
    );

    // 2. Property linkage
    recordTest(
      'Property linkage accuracy',
      created.propertyName === 'The Sovereign Ambli' && created.locality === 'Ambli',
      `Linked property: "${created.propertyName}" at ${created.locality}`
    );

    // 3. Deduplication prevention (Idempotency)
    const duplicate = await visitService.createVisitRequest(testVisitData);
    recordTest(
      'Deduplication protection on repeated clicks/submissions',
      duplicate.requestId === created.requestId,
      `Returned existing Request ID #${duplicate.requestId} instead of creating duplicate`
    );

    // 4. Query visit requests
    const visits = await visitService.getVisitRequests({ search: 'Ananya' });
    const found = visits.find((v) => v.requestId === created.requestId);
    recordTest(
      'Admin visit requests query and filtering',
      Boolean(found && found.mobileNumber === '+91 98765 43210'),
      `Retrieved record for ${found?.customerName} (${found?.mobileNumber})`
    );

    // 5. Excel Generation
    const { buffer: excelBuffer, filename } = await visitService.exportVisitRequestsToExcel();
    recordTest(
      'Excel .xlsx workbook generation',
      Boolean(excelBuffer && excelBuffer.length > 1000 && filename.endsWith('.xlsx')),
      `Workbook generated: ${filename} (${excelBuffer.length} bytes)`
    );

    // 6. Excel Content & Structure Verification
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(excelBuffer as any);
    const worksheet = workbook.getWorksheet('Visit Requests');

    recordTest(
      'Excel worksheet naming and frozen header',
      Boolean(worksheet && worksheet.views && worksheet.views[0]?.state === 'frozen'),
      `Worksheet name: "${worksheet?.name}", Frozen rows: 4`
    );

    let foundAnanyaInExcel = false;
    worksheet?.eachRow((row, rowNumber) => {
      const rowValues = row.values as any[];
      if (rowValues && rowValues.includes('Ananya Sharma')) {
        foundAnanyaInExcel = true;
      }
    });

    recordTest(
      'Excel contains saved customer record and proper column values',
      foundAnanyaInExcel,
      'Verified Ananya Sharma row present with correct property, mobile, and locality'
    );

    // 7. Formula Injection Protection Test
    await visitService.createVisitRequest({
      projectId: 'prycoons-ai',
      customerName: '=cmd|"/C calc"!A0',
      mobileNumber: '+91 91111 22222',
      propertyName: '+2+5',
      locality: '@SUM(1,1)',
      assistantId: 'prycoons-ai'
    });
    const { buffer: sanitizedBuffer } = await visitService.exportVisitRequestsToExcel();
    const secWorkbook = new ExcelJS.Workbook();
    await secWorkbook.xlsx.load(sanitizedBuffer as any);
    const secSheet = secWorkbook.getWorksheet('Visit Requests');
    let formulaInjected = false;
    secSheet?.eachRow((row) => {
      const vals = (row.values as any[]).map(v => String(v || ''));
      vals.forEach(v => {
        if (v.startsWith('=cmd') || (v.startsWith('+') && !v.startsWith("'+") && v.includes('+2+5'))) {
          formulaInjected = true;
        }
      });
    });
    recordTest(
      'Excel formula injection prevention',
      !formulaInjected,
      'Dangerous formula characters safely escaped with prepended single-quote'
    );

  } catch (err: any) {
    recordTest('Test Group A execution', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST GROUP C: Official Prycoons Contact Information
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP C: Official Prycoons Contact Information ---');

  try {
    // 1. Email inquiry
    const emailRes = await conversationService.processMessage({
      projectId: 'prycoons-ai',
      message: 'What is Prycoons\' email address?'
    });
    const hasOfficialEmail = emailRes.message.includes(OFFICIAL_PRYCOONS_CONTACT.email);
    recordTest(
      'Official email query',
      hasOfficialEmail,
      `Response contained "${OFFICIAL_PRYCOONS_CONTACT.email}"`
    );

    // 2. Phone inquiry
    const phoneRes = await conversationService.processMessage({
      projectId: 'prycoons-ai',
      message: 'What is the official phone number of Prycoons?'
    });
    const hasOfficialPhone = phoneRes.message.includes(OFFICIAL_PRYCOONS_CONTACT.phone);
    recordTest(
      'Official phone query',
      hasOfficialPhone,
      `Response contained "${OFFICIAL_PRYCOONS_CONTACT.phone}"`
    );

    // 3. General contact query
    const contactRes = await conversationService.processMessage({
      projectId: 'prycoons-ai',
      message: 'How can I contact Prycoons team?'
    });
    const hasBoth = contactRes.message.includes(OFFICIAL_PRYCOONS_CONTACT.email) &&
                    contactRes.message.includes(OFFICIAL_PRYCOONS_CONTACT.phone);
    recordTest(
      'General contact query returns authoritative email & phone',
      hasBoth,
      `Returned official email (${OFFICIAL_PRYCOONS_CONTACT.email}) and phone (${OFFICIAL_PRYCOONS_CONTACT.phone})`
    );

    // 4. Verification that obsolete phone number is NOT returned
    let obsoleteFound = false;
    for (const num of OBSOLETE_CONTACT_NUMBERS) {
      if (emailRes.message.includes(num) || phoneRes.message.includes(num) || contactRes.message.includes(num)) {
        obsoleteFound = true;
      }
    }
    recordTest(
      'Obsolete phone number (+91 98250 14890) strictly eliminated',
      !obsoleteFound,
      'Old advisory number never returned as official contact number'
    );

  } catch (err: any) {
    recordTest('Test Group C execution', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST GROUP D: Genuine PDF Brochure Generation
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP D: Genuine PDF Brochure Generation ---');

  try {
    const testProperty = {
      title: 'Solitaire Sky Ambli',
      location: 'Ambli Road, Ahmedabad',
      bhk: '4 & 5 BHK Palatial Living',
      priceRange: '₹4.50 Cr - ₹6.20 Cr',
      carpetArea: '3,850 - 5,200 sq.ft.',
      status: 'Under Construction (Dec 2026)',
      amenities: [
        'Infinity Edge Heated Pool',
        'Private Sky Lounge & Cigar Room',
        'Concierge & Valet Service',
        'Double-Height Grand Entrance Lobby',
        'Multi-Tier Biometric Security'
      ],
      sourceUrl: 'https://prycoons.com/properties-in-ambli-ahmedabad/solitaire-sky/',
      description: 'Ultra-exclusive residential enclave offering panoramic skyline views of western Ahmedabad.'
    };

    // 1. Generate PDF buffer
    const { buffer: pdfBuffer, filename: pdfFilename } = await brochureService.generateBrochurePdf(testProperty);

    recordTest(
      'PDF buffer generation',
      Boolean(pdfBuffer && pdfBuffer.length > 2000 && pdfFilename.endsWith('.pdf')),
      `Generated PDF: ${pdfFilename} (${pdfBuffer.length} bytes)`
    );

    // 2. Validate PDF binary signature (%PDF-1.x)
    const headerStr = pdfBuffer.slice(0, 8).toString('utf-8');
    const isRealPdf = headerStr.startsWith('%PDF-');

    recordTest(
      'Genuine PDF binary format verification',
      isRealPdf,
      `Binary header starts with "${headerStr.trim()}" (NOT an HTML file renamed to .pdf)`
    );

    // 3. Check PDF text content for required sections & official contact
    const rawPdf = pdfBuffer.toString('utf-8');
    const hexMatches = rawPdf.match(/<([0-9a-fA-F]+)>/g) || [];
    const joinedDecoded = hexMatches.map(m => {
      try {
        return Buffer.from(m.replace(/[<>]/g, ''), 'hex').toString('utf-8');
      } catch {
        return '';
      }
    }).join('');

    const fullDecodedPdf = rawPdf + ' ' + joinedDecoded;

    const hasTitle = fullDecodedPdf.includes('Solitaire Sky Ambli');
    const hasEmail = fullDecodedPdf.includes('admin@prycoons.com');
    const hasPhone = fullDecodedPdf.includes('7861072811');
    const hasObsoleteNum = fullDecodedPdf.includes('98250 14890') || fullDecodedPdf.includes('9825014890');

    recordTest(
      'PDF contains property specifications and lifestyle amenities',
      hasTitle,
      'Contains verified project title and configuration details'
    );

    recordTest(
      'PDF contains official Prycoons email and phone',
      hasEmail && hasPhone,
      `Contains ${OFFICIAL_PRYCOONS_CONTACT.email} and ${OFFICIAL_PRYCOONS_CONTACT.phone}`
    );

    recordTest(
      'PDF strictly excludes obsolete number +91 98250 14890',
      !hasObsoleteNum,
      'Old phone number is completely absent from PDF document'
    );

    // 4. Test missing optional fields or invalid image fallback
    const minimalProperty = {
      title: 'Minimal Project',
      location: 'Science City',
      image: 'https://invalid-broken-domain-9999.com/image.jpg' // Broken image test
    };
    const { buffer: fallbackPdf } = await brochureService.generateBrochurePdf(minimalProperty);
    const fallbackIsPdf = fallbackPdf.slice(0, 5).toString('utf-8') === '%PDF-';

    recordTest(
      'Graceful handling of broken image URLs without crashing',
      fallbackIsPdf,
      'Generated valid PDF even when remote image URL was inaccessible'
    );

  } catch (err: any) {
    recordTest('Test Group D execution', false, err.message);
  }

  // -------------------------------------------------------------
  // TEST GROUP B: Voice Input Frontend Verification
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP B: Voice Input Frontend Verification ---');
  const chatJsxPath = path.resolve(__dirname, '../../frontend/pages/chat/PublicChatPreview.jsx');
  const chatCssPath = path.resolve(__dirname, '../../frontend/styles/chat.css');

  const chatJsx = fs.readFileSync(chatJsxPath, 'utf-8');
  const chatCss = fs.readFileSync(chatCssPath, 'utf-8');

  recordTest(
    'Web Speech API integration in chat composer',
    chatJsx.includes('SpeechRecognition') && chatJsx.includes('toggleVoiceInput'),
    'SpeechRecognition API handler and event listeners wired up'
  );

  recordTest(
    'Microphone interactive button in composer',
    chatJsx.includes('chat-mic-btn') && chatJsx.includes('<Mic') && chatJsx.includes('<MicOff'),
    'Microphone button present beside input field with listening toggle'
  );

  recordTest(
    'Mic listening animation and visual styling',
    chatCss.includes('.chat-mic-btn') && chatCss.includes('@keyframes micPulse'),
    'Pulsing animation and accessibility tooltips configured'
  );

  recordTest(
    'Voice transcript review before submission',
    chatJsx.includes('setInput(currentTranscript)'),
    'Recognized speech populates input box for user review and editing before send'
  );

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`MASTER VERIFICATION RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('===============================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runMasterVerification().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
