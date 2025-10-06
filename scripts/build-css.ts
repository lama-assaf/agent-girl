#!/usr/bin/env bun
import postcss from 'postcss';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

async function buildAssets() {
  console.log('🎨 Building assets for standalone binary...');

  // Build CSS
  const cssContent = readFileSync('./client/globals.css', 'utf-8');
  const cssResult = await postcss([
    tailwindcss(),
    autoprefixer,
  ]).process(cssContent, {
    from: './client/globals.css',
    to: undefined
  });

  // Build client JS bundle
  console.log('📦 Building client bundle...');
  const buildResult = await Bun.build({
    entrypoints: ['./client/index.tsx'],
    outdir: './dist',
    target: 'browser',
    format: 'esm',
    minify: true,
    sourcemap: 'none',
  });

  if (!buildResult.success) {
    console.error('❌ Client build failed');
    process.exit(1);
  }

  // Read the built JS
  const jsBundle = await buildResult.outputs[0].text();

  // Read HTML template
  const htmlTemplate = readFileSync('./client/index.html', 'utf-8');

  // Create embedded assets file
  const tsContent = `// Auto-generated - do not edit
export const EMBEDDED_CSS = ${JSON.stringify(cssResult.css)};
export const EMBEDDED_JS = ${JSON.stringify(jsBundle)};
export const EMBEDDED_HTML = ${JSON.stringify(htmlTemplate)};
`;

  mkdirSync('./server/generated', { recursive: true });
  writeFileSync('./server/generated/embedded-assets.ts', tsContent);

  // Also write to dist for reference
  mkdirSync('./dist', { recursive: true });
  writeFileSync('./dist/globals.css', cssResult.css);
  writeFileSync('./dist/index.js', jsBundle);
  writeFileSync('./dist/index.html', htmlTemplate);

  console.log('✅ Assets built successfully');
  console.log(`   - CSS: ${(cssResult.css.length / 1024).toFixed(2)} KB`);
  console.log(`   - JS: ${(jsBundle.length / 1024).toFixed(2)} KB`);
  console.log(`   - All assets embedded in binary`);
}

buildAssets().catch(console.error);
