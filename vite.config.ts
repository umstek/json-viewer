/// <reference types="vitest" />

import { resolve } from 'node:path';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import tsconfigPaths from 'vite-tsconfig-paths';
import { dependencies, name, peerDependencies } from './package.json';

const libraryName = (
  name.indexOf('/') > -1 ? name.split('/').pop() : name
)?.replace(/-/g, '_');

// Combine peerDependencies and dependencies for externalization
const externalDeps = [
  'react/jsx-runtime',
  ...Object.keys(peerDependencies || {}),
  ...Object.keys(dependencies || {}),
];

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'import.meta.vitest': 'undefined',
  },
  plugins: [
    tsconfigPaths(),
    react(),
    dts({
      rollupTypes: true,
      copyDtsFiles: true,
      insertTypesEntry: true,
    }),
  ],
  build: {
    target: 'esnext',
    minify: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: libraryName,
      formats: ['es', 'cjs'], // Specify desired formats
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: externalDeps,
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          // Add other globals if needed
        },
      },
    },
  },
  // Ensure Vitest doesn't try to bundle external dependencies
  test: {
    globals: true,
    environment: 'jsdom',
    // Add any other necessary Vitest configurations
  },
});
