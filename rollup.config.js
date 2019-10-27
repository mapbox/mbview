import postcss from 'rollup-plugin-postcss'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json'
import path from 'path'

const dir = 'dist'
const input = 'src/main.js'
const sourcemap = true
const sharedPlugins = () => [json(), postcss(), resolve(), commonjs()]
export default [
  {
    input,
    plugins: [...sharedPlugins()],
    output: {
      dir: 'public',
      format: 'esm',
      sourcemap,
    },
    manualChunks(id) {
      // from https://philipwalton.com/articles/using-native-javascript-modules-in-production-today/
      if (id.includes('node_modules')) {
        // Return the directory name following the last `node_modules`.
        // Usually this is the package, but it could also be the scope.
        const dirs = id.split(path.sep);
        return dirs[dirs.lastIndexOf('node_modules') + 1];
      }
    }
  }, {
    input,
    plugins: [...sharedPlugins()], 
    output: {
      name: 'app',
      file: 'public/main.umd.js',
      format: 'umd',
      sourcemap,
    },
  }
]