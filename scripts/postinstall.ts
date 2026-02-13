import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const rustPath = path.resolve(process.cwd(), 'native');
const isWindows = process.platform === 'win32';
// Correctly determine cargo command
const cargoCmd = 'cargo';

try {
  // Check if cargo exists
  execSync(`${cargoCmd} --version`, { stdio: 'ignore' });
  console.log('🦀 Rust detected. Building native component...');
  
  const build = spawn(cargoCmd, ['build', '--release'], {
    cwd: rustPath,
    stdio: 'inherit',
    shell: true
  });

  build.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Native build complete.');
    } else {
      console.error('❌ Native build failed.');
      process.exit(1);
    }
  });

} catch (error) {
  console.log('⚠️  Rust (cargo) not found in PATH.');
  console.log('   Skipping native build. The React app will work, but the Rust demo will not be available.');
  console.log('   To enable the Rust demo, install Rust from https://rustup.rs/ and run npm install again.');
  process.exit(0); // Exit successfully so npm install doesn't fail
}
