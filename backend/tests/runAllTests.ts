import { execSync } from 'child_process';
import path from 'path';

console.log('=======================================================');
console.log('🚀 RUNNING ALL BACKEND AUTOMATED TEST SUITES');
console.log('=======================================================');

const testFiles = [
  'tests/openai.test.ts',
  'tests/rag.test.ts',
  'tests/context.test.ts',
  'tests/api.test.ts',
  'tests/chat_improvements.test.ts',
  'tests/e2e.test.ts',
];

let allPassed = true;

for (const testFile of testFiles) {
  console.log(`\n▶ Running ${testFile}...`);
  try {
    execSync(`cmd /c npx tsx "${testFile}"`, {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
    });
  } catch (err: any) {
    console.error(`❌ ${testFile} failed.`);
    allPassed = false;
    break;
  }
}

if (allPassed) {
  console.log('\n=======================================================');
  console.log('🎉 ALL TEST SUITES PASSED END-TO-END WITH ZERO ERRORS!');
  console.log('=======================================================\n');
  process.exit(0);
} else {
  console.error('\n❌ One or more test suites failed.');
  process.exit(1);
}
