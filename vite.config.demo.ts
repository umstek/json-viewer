import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, lazyPlugins } from 'vite-plus';

export default defineConfig({
  base: '/json-viewer/',
  resolve: {
    tsconfigPaths: true,
  },
  plugins: lazyPlugins(
    () => [tailwindcss(), react()] as unknown as NonNullable<ReturnType<typeof lazyPlugins>>,
  ),
});
