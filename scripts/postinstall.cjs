const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Use __dirname to find package root (scripts/../)
const packageRoot = path.resolve(__dirname, '..');

try {
  // Only run if cargo is available
  try {
    const result = spawnSync('cargo', ['--version']);
    if (result.error || result.status !== 0) {
      console.log('Cargo not found, skipping native build.');
      process.exit(0);
    }
  } catch (e) {
    console.log('Cargo check failed, skipping native build.');
    process.exit(0);
  }

  console.log('Building native binary locally...');
  const nativeDir = path.resolve(packageRoot, 'native');

  if (!fs.existsSync(nativeDir)) {
    console.warn('Native directory not found at:', nativeDir);
    process.exit(0);
  }

  const build = spawnSync('cargo', ['build', '--release'], {
    cwd: nativeDir,
    stdio: 'inherit',
  });

  if (build.status === 0) {
    const isWindows = process.platform === 'win32';
    const ext = isWindows ? '.exe' : '';
    const src = path.join(nativeDir, 'target/release/cli-use-demo' + ext);

    // Install to dist/bin
    const destDir = path.resolve(packageRoot, 'dist/bin');
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

    const dest = path.join(destDir, 'cli-use-demo' + ext);

    try {
      fs.copyFileSync(src, dest);
      console.log('Native binary built and installed successfully.');
    } catch (err) {
      console.error('Error copying binary:', err);
      // Don't fail install just because copy failed
    }
  } else {
    console.error('Failed to build native binary. You may need to build manually.');
  }
} catch (error) {
  console.error('Postinstall script error:', error);
  // Always exit successfully so npm install doesn't crash
  process.exit(0);
}
