import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  define: { __DEPLOYED_AT__: JSON.stringify(new Date().toISOString()) },
});
