import { spawn } from 'child_process';
import path from 'path';

const rustBinaryPath = path.resolve(process.cwd(), 'native/target/release/ratatui-demo');

console.log('Starting Ratatui Demo...');
console.log(`Binary path: ${rustBinaryPath}`);

const child = spawn(rustBinaryPath, [], {
  stdio: 'inherit',
});

child.on('error', (err) => {
  console.error('Failed to start demo:', err);
  console.log('
Make sure you have built the Rust binary first by running: npm run build:rust');
});

child.on('close', (code) => {
  console.log(`Demo exited with code ${code}`);
});
