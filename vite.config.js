import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { spawn } from 'child_process';
import path from 'path';

function kopisAdminSyncPlugin() {
  let isRunning = false;
  return {
    name: 'kopis-admin-sync-plugin',
    configureServer(server) {
      server.middlewares.use('/api/admin/kopis-sync', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ success: false, message: 'Method Not Allowed' }));
          return;
        }
        if (isRunning) {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true, status: 'already_running' }));
          return;
        }
        isRunning = true;
        const scriptPath = path.resolve(process.cwd(), 'scripts/daily_kopis_sync.cjs');
        const child = spawn(process.execPath, [scriptPath], {
          cwd: process.cwd(),
          stdio: 'ignore',
          detached: false
        });
        child.on('close', () => {
          isRunning = false;
        });
        child.on('error', () => {
          isRunning = false;
        });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, status: 'started' }));
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), kopisAdminSyncPlugin()],
  server: {
    port: 3000,
    open: false,
    proxy: {
      '/api/kopis': {
        target: 'http://www.kopis.or.kr',
        changeOrigin: true,
        rewrite: (pathStr) => pathStr.replace(/^\/api\/kopis/, '')
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

