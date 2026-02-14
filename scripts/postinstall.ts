import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Only run if cargo is available
try {
  const result = spawnSync('cargo', ['--version']);
  if (result.error || result.status !== 0) {
    console.log('Cargo not found, skipping native build.');
    process.exit(0);
  }
} catch (e) {
  process.exit(0);
}

console.log('Building native binary locally...');
const nativeDir = path.resolve(process.cwd(), 'native');

const build = spawnSync('cargo', ['build', '--release'], {
  cwd: nativeDir,
  stdio: 'inherit',
});

if (build.status === 0) {
  const isWindows = process.platform === 'win32';
  const ext = isWindows ? '.exe' : '';
  const src = path.join(nativeDir, 'target/release/ratatui-demo' + ext);
  // We need to put it where the CLI expects it.
  // When installed globally, the structure is usually:
  // node_modules/@cli-use/tui/
  //   dist/bin/ratatui-demo
  //   native/
  
  const destDir = path.resolve(process.cwd(), 'dist/bin');
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  
  const dest = path.join(destDir, 'ratatui-demo' + ext);
  fs.copyFileSync(src, dest);
  console.log('Native binary built and installed successfully.');
} else {
  console.error('Failed to build native binary.');
}
