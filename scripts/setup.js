#!/usr/bin/env node

/**
 * LibrePuter Setup Script
 *
 * Guides the user through setting up LibrePuter with their existing
 * LibreChat and Puter installations.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════╗');
  console.log('║         LibrePuter Setup Wizard              ║');
  console.log('╚═══════════════════════════════════════════════╝');
  console.log('');

  const librechatPath = await question(
    `Path to LibreChat installation [../bootybotty/LibreChat]: `,
  );
  const resolvedLibrechat = path.resolve(
    librechatPath || '../bootybotty/LibreChat',
  );

  const puterPath = await question(
    `Path to Puter installation [../bootybotty/puter]: `,
  );
  const resolvedPuter = path.resolve(puterPath || '../bootybotty/puter');

  const puterPort = await question(`Puter server port [4100]: `);
  const resolvedPuterPort = puterPort || '4100';

  console.log('');
  console.log('📋 Configuration:');
  console.log(`  LibreChat: ${resolvedLibrechat}`);
  console.log(`  Puter:     ${resolvedPuter} (port ${resolvedPuterPort})`);
  console.log('');

  // Check paths exist
  const librechatOk = fs.existsSync(resolvedLibrechat);
  const puterOk = fs.existsSync(resolvedPuter);

  if (!librechatOk) {
    console.warn(`⚠ Warning: LibreChat not found at ${resolvedLibrechat}`);
  }
  if (!puterOk) {
    console.warn(`⚠ Warning: Puter not found at ${resolvedPuter}`);
  }

  // Check LibreChat index.js
  const indexPath = path.join(resolvedLibrechat, 'api', 'server', 'index.js');
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    if (content.includes('libreputer')) {
      console.log('✓ LibreChat already patched for LibrePuter');
    } else {
      const ans = await question(
        'Patch LibreChat to mount LibrePuter proxy? [Y/n]: ',
      );
      if (ans !== 'n' && ans !== 'N') {
        require('./patch-librechat')(resolvedLibrechat, `http://localhost:${resolvedPuterPort}`);
      }
    }
  }

  // Create .env
  const envPath = path.resolve(__dirname, '..', '.env');
  const envContent =
    `PUTER_URL=http://localhost:${resolvedPuterPort}\n` +
    `LIBRECHAT_URL=http://localhost:3080\n` +
    `LIBREPUTER_PORT=3090\n`;

  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envContent);
    console.log('✓ Created .env file');
  }

  console.log('');
  console.log('✅ Setup complete!');
  console.log('');
  console.log('To start the LibrePuter standalone proxy:');
  console.log('  npm run dev -w packages/librechat-backend');
  console.log('');
  console.log('Or mount directly into LibreChat:');
  console.log('  Edit librechat.yaml and add the custom endpoint (see config/librechat.yaml.example)');
  console.log('  Then restart LibreChat');
  console.log('');

  rl.close();
}

main().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});