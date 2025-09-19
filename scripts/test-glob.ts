#!/usr/bin/env npx tsx

import fg from 'fast-glob';

async function testGlob() {
  console.log('Testing glob...');
  
  try {
    const files = await glob('src/**/*.{ts,tsx}', {
      cwd: process.cwd(),
      absolute: false,
      nodir: true,
      follow: false,
      maxDepth: 5
    });
    
    console.log(`Found ${files.length} files`);
    console.log('First 5 files:', files.slice(0, 5));
  } catch (error) {
    console.error('Glob failed:', error);
  }
}

testGlob().then(() => {
  console.log('Test completed');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});