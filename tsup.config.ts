import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/hooks/index.ts', 'src/cli/index.ts', 'src/ai-worker.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  shims: true,
  external: ['react', 'react-reconciler'],
  esbuildOptions(options) {
    options.banner = {
      js: '/**\n * @license MIT\n * cli-use - React-based Terminal UI Framework\n * Inspired by Ratatui (https://ratatui.rs)\n */',
    };
  },
  outDir: 'dist',
});
