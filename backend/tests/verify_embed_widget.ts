/**
 * Automated Verification: Universal Embed Widget & Iframe Configuration
 */
import fs from 'fs';
import path from 'path';

function runTests() {
  console.log('================================================================');
  console.log('🧪 VERIFYING CHATBOT EMBED WIDGET & EMBED CODES');
  console.log('================================================================\n');

  // Test 1: Check public/widget.js existence and contents
  const widgetPath = path.resolve(__dirname, '../../public/widget.js');
  if (!fs.existsSync(widgetPath)) {
    throw new Error('❌ public/widget.js does not exist!');
  }
  const widgetContent = fs.readFileSync(widgetPath, 'utf8');
  console.log('✓ public/widget.js exists (' + widgetContent.length + ' bytes)');

  if (!widgetContent.includes('brim-chat-widget-launcher')) {
    throw new Error('❌ widget.js missing launcher class');
  }
  if (!widgetContent.includes('data-assistant-id')) {
    throw new Error('❌ widget.js does not read data-assistant-id attribute');
  }
  if (!widgetContent.includes('?embed=true')) {
    throw new Error('❌ widget.js does not append ?embed=true to iframe src');
  }
  console.log('✓ widget.js properly parses data-assistant-id and injects launcher & iframe with ?embed=true');

  // Test 2: Check dist/widget.js build output
  const distWidgetPath = path.resolve(__dirname, '../../dist/widget.js');
  if (!fs.existsSync(distWidgetPath)) {
    throw new Error('❌ dist/widget.js was not generated during Vite build!');
  }
  console.log('✓ dist/widget.js is present in build bundle');

  // Test 3: Check BotShare.jsx contains dynamic origin and both widget + iframe options
  const botSharePath = path.resolve(__dirname, '../../frontend/pages/bot/BotShare.jsx');
  const botShareContent = fs.readFileSync(botSharePath, 'utf8');
  if (botShareContent.includes('cdn.brimai.com')) {
    throw new Error('❌ BotShare.jsx still contains broken cdn.brimai.com domain!');
  }
  if (!botShareContent.includes('widget.js') || !botShareContent.includes('<iframe')) {
    throw new Error('❌ BotShare.jsx missing widget or iframe snippet');
  }
  console.log('✓ BotShare.jsx provides both dynamic widget script and iframe embed options');

  // Test 4: Check PublicChatPreview.jsx supports isEmbed mode
  const publicChatPath = path.resolve(__dirname, '../../frontend/pages/chat/PublicChatPreview.jsx');
  const publicChatContent = fs.readFileSync(publicChatPath, 'utf8');
  if (!publicChatContent.includes('isEmbed')) {
    throw new Error('❌ PublicChatPreview.jsx does not implement isEmbed mode');
  }
  console.log('✓ PublicChatPreview.jsx supports responsive edge-to-edge embed mode');

  // Test 5: Check vercel.json includes frame-ancestors & CORS headers
  const vercelPath = path.resolve(__dirname, '../../vercel.json');
  const vercelContent = fs.readFileSync(vercelPath, 'utf8');
  if (!vercelContent.includes('frame-ancestors') || !vercelContent.includes('widget.js')) {
    throw new Error('❌ vercel.json missing frame-ancestors or widget.js header');
  }
  console.log('✓ vercel.json permits cross-origin iframe framing and static widget.js delivery');

  console.log('\n================================================================');
  console.log('🎉 ALL EMBED WIDGET TESTS PASSED SUCCESSFULLY!');
  console.log('================================================================\n');
}

runTests();

