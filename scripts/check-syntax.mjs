import fs from 'fs';

const content = fs.readFileSync('src/lib/brand-products-catalog.ts', 'utf8');
const lines = content.split('\n');

console.log('Total lines:', lines.length);

// Check brackets
let openCurly = 0;
let openSquare = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let ch of line) {
    if (ch === '{') openCurly++;
    if (ch === '}') openCurly--;
    if (ch === '[') openSquare++;
    if (ch === ']') openSquare--;
  }
  if (openCurly < 0 || openSquare < 0) {
    console.log(`Mismatch at line ${i + 1}: openCurly=${openCurly}, openSquare=${openSquare}`);
    break;
  }
}
console.log(`Final: openCurly=${openCurly}, openSquare=${openSquare}`);
