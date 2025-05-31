import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import babel from 'vite-plugin-babel';

const babelConfig = {
  ...babel({
    filter: /\.m?jsx?$/,
    babelConfig: {
      plugins: [
        '@mui/internal-babel-plugin-display-name',
        '@babel/plugin-transform-arrow-functions',
        '@babel/plugin-transform-function-name',
      ],
    },
  }),
  enforce: 'post',
};
const t = babelConfig.transform;
babelConfig.transform = async (code, id) => {
  const result = t(code, id);
  if (!result) {
    return undefined;
  }
  const out = await result;
  return out;
};

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      // 'react/jsx-runtime': '../react/build/node_modules/react/cjs/react-jsx-runtime.production.js',
      // 'react/jsx-runtime-dev': '../react/build/node_modules/react/cjs/react-jsx-runtime.production.js',
      // 'react-dom/client': '../react/build/node_modules/react-dom/cjs/react-dom.production.js',
      // 'react-dom': '../react/build/node_modules/react-dom/cjs/react-dom.production.js',
      // 'react': '../react/build/node_modules/react/cjs/react.production.js',
      // 'react-dom/client': 'react-dom/profiling',
    },
  },
  build: {
    minify: false,
  },
  plugins: [
    react(),
    // @ts-ignore
    babelConfig,
    {
      name: 'replace-code',
      enforce: 'post',
      transform(code) {
        // @ts-ignore
        return code.replaceAll('process.env.NODE_ENV', '"development"');
      },
    },

    // process.env.FAST === '1' ? {
    //   ...babel({
    //     filter: /\.(jsx?|tsx?)/,
    //     babelConfig: {
    //       plugins: [
    //         'fast-jsx',
    //       ]
    //     }
    //   }),
    //   enforce: 'post',
    // } : undefined,
  ],
});
