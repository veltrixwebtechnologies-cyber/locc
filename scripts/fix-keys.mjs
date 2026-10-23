import fs from 'fs';

let content = fs.readFileSync('src/lib/brand-products-catalog.ts', 'utf8');

// Replace any unquoted key that has spaces, hyphens, slashes, or special characters before ':'
// within specifications or objects
const fixed = content.replace(/^(\s+)([A-Za-z0-9_ -]+):\s*(".*?"|'.*?'|[0-9]+|true|false)/gm, (match, indent, key, val) => {
  const trimmedKey = key.trim();
  // If key has spaces or hyphens and is not already quoted
  if (/[ -]/.test(trimmedKey) && !trimmedKey.startsWith('"') && !trimmedKey.startsWith("'")) {
    return `${indent}"${trimmedKey}": ${val}`;
  }
  return match;
});

fs.writeFileSync('src/lib/brand-products-catalog.ts', fixed, 'utf8');
console.log('Fixed unquoted keys in brand-products-catalog.ts');
