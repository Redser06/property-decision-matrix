import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5178,
    proxy: {
      '/api/evaluate-decisions': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        rewrite: () => '/rapid-prototyping-4134c/europe-west2/evaluatePropertyDecisions',
      },
    },
  }
});
