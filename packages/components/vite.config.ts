import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'VirtualDesignSystemComponents',
      formats: ['es'],
      fileName: () => 'index.js'
    },
    rollupOptions: {
      external: ['lit', '@virtual-ds/tokens'],
      output: {
        globals: {
          lit: 'Lit',
          '@virtual-ds/tokens': 'VirtualDSTokens'
        }
      }
    },
    sourcemap: true,
    target: 'es2019'
  },
  esbuild: {
    jsx: 'automatic'
  }
});
