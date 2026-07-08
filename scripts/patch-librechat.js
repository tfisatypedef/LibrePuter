#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const librechatPath = getArg('--librechat-path', args) || path.resolve(__dirname, '../../LibreChat');

function getArg(name, args) {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  return args[idx + 1] || null;
}

function parseProxyConfig() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const env = fs.readFileSync(envPath, 'utf8');
    const mode = env.match(/LIBREPUTER_MODE=(\S+)/)?.[1] || 'hosted';
    const puterUrl = env.match(/PUTER_URL=(\S+)/)?.[1] || 'http://localhost:4100';
    return { mode, puterUrl };
  }
  return { mode: 'hosted', puterUrl: 'http://localhost:4100' };
}

const indexPath = path.join(librechatPath, 'api', 'server', 'index.js');

if (!fs.existsSync(indexPath)) {
  console.error(`LibreChat index.js not found at: ${indexPath}`);
  console.error('Make sure --librechat-path points to the correct LibreChat directory.');
  process.exit(1);
}

let content = fs.readFileSync(indexPath, 'utf8');

if (content.includes('libreputer')) {
  console.log('LibrePuter patch already applied. Skipping.');
  process.exit(0);
}

const config = parseProxyConfig();
const isHosted = config.mode === 'hosted';

const routesRequireIndex = content.indexOf("const routes = require('./routes');");
if (routesRequireIndex === -1) {
  console.error('Could not find routes import in index.js');
  process.exit(1);
}

const modeType = isHosted ? 'hosted' : 'self-hosted';

const patchRequire = `
const { createPuterProxyRouter, createPuterHostedProxyRouter } = require('@libreputer/librechat-backend');

let puterProxy;
if (process.env.LIBREPUTER_MODE === 'self-hosted') {
  const PUTER_URL = process.env.PUTER_URL || '${config.puterUrl}';
  puterProxy = createPuterProxyRouter({ puterUrl: PUTER_URL, librechatUrl: '' });
} else {
  puterProxy = createPuterHostedProxyRouter();
}

`;

content = content.slice(0, routesRequireIndex) + patchRequire + content.slice(routesRequireIndex);

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
console.log(` LibreChat patched successfully!`);
console.log(` Mode: ${modeType}`);
if (isHosted) {
  console.log(` Users sign in with Puter account — no API keys needed`);
} else {
  console.log(` Puter URL: ${config.puterUrl}`);
}
console.log(` Proxy endpoint: /api/puter`);
console.log('');
console.log('Next steps:');
console.log('  1. Add @libreputer/librechat-backend to LibreChat dependencies');
console.log('  2. Add librechat.yaml config (see config/librechat.yaml.example)');
console.log('  3. Add Puter.js script tag to LibreChat frontend:');
console.log('     <script src="https://js.puter.com/v2/"></script>');
console.log('  4. Restart LibreChat');