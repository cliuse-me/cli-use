import fs from 'fs';
import path from 'path';

const isWindows = process.platform === 'win32';
const extension = isWindows ? '.exe' : '';
const binaryName = 'ratatui-demo' + extension;

const srcPath = path.resolve(process.cwd(), 'native/target/release', binaryName);
const destDir = path.resolve(process.cwd(), 'dist/bin');
const destPath = path.resolve(destDir, binaryName);

console.log('Copying binary...');
console.log('Source:', srcPath);
console.log('Dest:', destPath);

if (!fs.existsSync(srcPath)) {
  console.error('Error: Source binary not found. Did you run npm run build:rust?');
  process.exit(1);
}

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

fs.copyFileSync(srcPath, destPath);

if (!isWindows) {
  fs.chmodSync(destPath, '755');
}

console.log('Binary copied successfully.');
