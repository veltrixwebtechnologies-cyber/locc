import { execSync } from 'child_process';

try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('TSC passed with 0 errors!');
} catch (err) {
  const output = err.stdout ? err.stdout.toString() : '';
  const errLines = output.split('\n');
  console.log('Total error lines:', errLines.length);
  console.log('First 25 error lines:\n' + errLines.slice(0, 25).join('\n'));
}
