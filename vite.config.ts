/// <reference types="vite-plus/test" />

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { defineConfig, lazyPlugins } from 'vite-plus';

const libraryName = 'json_viewer';

const externalDeps = [
  'react/jsx-runtime',
  'react',
  'react-dom',
  '@js-temporal/polyfill',
  '@radix-ui/react-checkbox',
  '@radix-ui/react-collapsible',
  '@radix-ui/react-dialog',
  '@radix-ui/react-label',
  '@radix-ui/react-popover',
  '@radix-ui/react-slot',
  '@radix-ui/react-tooltip',
  '@tanstack/react-table',
  '@tanstack/react-virtual',
  'ajv',
  'ajv-formats',
  'class-variance-authority',
  'clsx',
  'js-yaml',
  'libphonenumber-js',
  'lucide-react',
  'papaparse',
  'zod',
];

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  staged: {
    '*': 'vp check --fix',
  },
  fmt: {
    singleQuote: true,
    indentStyle: 'space',
    sortTailwindcss: {
      functions: ['cn', 'cx', 'clsx'],
    },
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      'no-unused-vars': 'error',
    },
  },
  define: {
    'import.meta.vitest': 'undefined',
  },
  plugins: lazyPlugins(
    () =>
      [
        tailwindcss(),
        react(),
        dts({
          copyDtsFiles: true,
          insertTypesEntry: true,
        }),
      ] as unknown as NonNullable<ReturnType<typeof lazyPlugins>>,
  ),
  build: {
    target: 'esnext',
    minify: true,
    lib: {
      entry: 'src/index.ts',
      name: libraryName,
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: externalDeps,
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    exclude: ['**/node_modules/**', '**/dist/**', '**/.delta/**'],
    server: {
      deps: {
        inline: ['zod'],
      },
    },
  },
});
