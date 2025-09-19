#!/usr/bin/env npx tsx

import fg from 'fast-glob';

async function test() {
  console.log('Testing fast-glob...');
  
  try {
    const files = await fg(['src/services/**/*.{ts,tsx}'], {
      cwd: process.cwd(),
      onlyFiles: true,
      unique: true,
      dot: false,
      followSymbolicLinks: false,
      deep: 12,
      absolute: true,
    });
    
    console.log(`Found ${files.length} files:`);
    files.slice(0, 5).forEach(f => console.log(`  ${f}`));
    if (files.length > 5) console.log(`  ... and ${files.length - 5} more`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

test();