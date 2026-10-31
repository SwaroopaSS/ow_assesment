import { cpSync, mkdirSync, rmSync } from 'node:fs';
import * as esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
cpSync('index.html', 'dist/index.html');

const options = {
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outdir: 'dist/assets',
  entryNames: 'app', 
  jsx: 'automatic',
  target: 'es2020',
  minify: !watch,
  sourcemap: watch,
  define: { 'process.env.NODE_ENV': JSON.stringify(watch ? 'development' : 'production') },
  logLevel: 'info',
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
  console.log('Watching for changes… (run the backend and open http://localhost:4000)');
} else {
  await esbuild.build(options);
}
