import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: mode === 'github-pages' ? '/mattabulka/' : '/',
  plugins: [
    react(),
    legacy({
      /** Moderní chunk pro aktuální prohlížeče + legacy polyfilly (ESM, import.meta, …) pro starší zařízení. */
      targets: [
        'defaults',
        'Chrome >= 61',
        'Firefox >= 67',
        'Safari >= 12',
        'iOS >= 12',
        'Edge >= 79',
      ],
      modernPolyfills: true,
      renderLegacyChunks: true,
    }),
  ],
}));
