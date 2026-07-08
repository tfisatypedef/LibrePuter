#!/usr/bin/env node

/**
 * LibrePuter Patch Script
 *
 * Patches LibreChat's server index.js to mount the LibrePuter proxy router.
 *
 * Usage: node scripts/patch-librechat.js [--librechat-path ../LibreChat] [--puter-url http://localhost:4100]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const librechatPath = getArg('--librechat-path', args) || path.resolve(__dirname, '../../LibreChat');
const puterUrl = getArg('--puter-url', args) || 'http://localhost:4100';

function getArg(name, args) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  return args[idx + 1] || null;
}

const indexPath = path.join(librechatPath, 'api', 'server', 'index.js');

if (!fs.existsSync(indexPath)) {
  console.error(`LibreChat index.js not found at: ${indexPath}`);
  console.error('Make sure --librechat-path points to the correct LibreChat directory.');
  process.exit(1);
}

let content = fs.readFileSync(indexPath, 'utf8');

// Check if already patched
if (content.includes('libreputer')) {
  console.log('LibrePuter patch already applied. Skipping.');
  process.exit(0);
}

// 1. Add require for LibrePuter proxy before the routes require
const routesRequireIndex = content.indexOf("const routes = require('./routes');");
if (routesRequireIndex === -1) {
  console.error('Could not find routes import in index.js');
  process.exit(1);
}

const patchRequire = `
const { createPuterProxyRouter } = require('@libreputer/librechat-backend');
const PUTER_URL = process.env.PUTER_URL || '${puterUrl}';
const puterProxy = createPuterProxyRouter({ puterUrl: PUTER_URL, librechatUrl: '' });

`;

content = content.slice(0, routesRequireIndex) + patchRequire + content.slice(routesRequireIndex);

// 2. Add the route mount after existing API routes, before 404 handler
const apiNotFoundIndex = content.indexOf("app.use('/api', apiNotFound);");
if (apiNotFoundIndex === -1) {
  console.error('Could not find apiNotFound route in index.js');
  process.exit(1);
}

const patchRoute = `
app.use('/api/puter', puterProxy);

`;

content = content.slice(0, apiNotFoundIndex) + patchRoute + content.slice(apiNotFoundIndex);

fs.writeFileSync(indexPath, content, 'utf8');
console.log(`✓ LibreChat patched successfully!`);
console.log(`  Puter URL: ${puterUrl}`);
console.log(`  Proxy endpoint: /api/puter`);
console.log('');
console.log('Next steps:');
console.log('  1. Add @libreputer/librechat-backend to LibreChat dependencies');
console.log('  2. Add librechat.yaml config (see config/librechat.yaml.example)');
console.log('  3. Restart LibreChat');