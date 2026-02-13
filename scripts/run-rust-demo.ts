import { spawn } from 'child_process';
import path from 'path';

const rustBinaryPath = path.resolve(process.cwd(), 'native/target/release/ratatui-demo');
const workerPath = path.resolve(process.cwd(), 'src/ai-worker.ts');

console.log('Starting Ratatui Demo...');
console.log(`Binary path: ${rustBinaryPath}`);
console.log(`Worker path: ${workerPath}`);

const child = spawn(rustBinaryPath, [workerPath], {
  stdio: 'inherit',
});

child.on('error', (err) => {
  console.error('Failed to start demo:', err);
  console.log('\nMake sure you have built the Rust binary first by running: npm run build:rust');
});

child.on('close', (code) => {
  console.log(`Demo exited with code ${code}`);
});
