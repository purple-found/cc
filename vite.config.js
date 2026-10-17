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
  }
});
