import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
    proxy: {
      '/api/kopis': {
        target: 'http://www.kopis.or.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/kopis/, '')
      }
    }
  },
  build: {
    chunkSizeWarningLimit: 2600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('src/data/initialRealConcerts')) {
            return 'concert-dataset';
          }
        }
      }
    }
  }
});
