import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@virtual-ds/components': path.resolve(__dirname, '..', '..', 'packages/components'),
      '@virtual-ds/tokens': path.resolve(__dirname, '..', '..', 'packages/tokens')
    }
  },
  server: {
    fs: {
      allow: ['..', '../../packages']
    }
  }
});
