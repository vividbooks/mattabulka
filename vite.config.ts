import legacy from '@vitejs/plugin-legacy';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** GitHub Pages (project site): URL je https://<uživatel>.github.io/<název-repa>/ — base musí být /název-repa/. */
function githubPagesBase(): string {
  const fromEnv = process.env.VITE_PAGES_BASE?.trim();
  if (fromEnv) return fromEnv.endsWith('/') ? fromEnv : `${fromEnv}/`;

  const repo = process.env.GITHUB_REPOSITORY?.trim();
  if (repo?.includes('/')) {
    const name = repo.split('/')[1];
    if (name) return `/${name}/`;
  }
  /* Lokální build bez env — relativní cesty fungují při ručním nahrání dist. */
  return './';
}

export default defineConfig(({ mode }) => ({
  base: mode === 'github-pages' ? githubPagesBase() : '/',
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
