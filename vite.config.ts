import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

const manualChunks = (id: string) => {
  if (!id.includes('node_modules')) return undefined;

  if (id.includes('react-dom') || id.includes('/react/')) {
    return 'vendor-react';
  }

  if (id.includes('recharts')) {
    return 'vendor-charts';
  }

  if (id.includes('@supabase') || id.includes('@google/genai')) {
    return 'vendor-services';
  }

  if (id.includes('react-markdown') || id.includes('remark') || id.includes('unified') || id.includes('micromark')) {
    return 'vendor-content';
  }

  if (id.includes('motion') || id.includes('framer-motion')) {
    return 'vendor-motion';
  }

  if (id.includes('lucide-react')) {
    return 'vendor-icons';
  }

  return undefined;
};

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks,
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
