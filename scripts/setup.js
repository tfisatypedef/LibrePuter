#!/usr/bin/env node

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
  console.log('LibrePuter bridges 500+ AI models into LibreChat using Puter\'s');
  console.log('keyless User-Pays model. Users sign in with their own Puter');
  console.log('account and pay for their own AI usage. No API keys needed.');
  console.log('');

  const mode = await question(
    `Proxy mode? (hosted = keyless via api.puter.com, self-hosted = your own Puter server) [hosted]: `,
  );
  const resolvedMode = (mode || 'hosted').trim().toLowerCase();
  const isHosted = resolvedMode === 'hosted' || resolvedMode === '';

  if (!isHosted) {
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
    console.log('  Configuration:');
    console.log(`  LibreChat: ${resolvedLibrechat}`);
    console.log(`  Puter:     ${resolvedPuter} (port ${resolvedPuterPort})`);
    console.log('');

    const librechatOk = fs.existsSync(resolvedLibrechat);
    const puterOk = fs.existsSync(resolvedPuter);

    if (!librechatOk) {
      console.warn(`  Warning: LibreChat not found at ${resolvedLibrechat}`);
    }
    if (!puterOk) {
      console.warn(`  Warning: Puter not found at ${resolvedPuter}`);
    }

    const indexPath = path.join(resolvedLibrechat, 'api', 'server', 'index.js');
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, 'utf8');
      if (content.includes('libreputer')) {
        console.log('  LibreChat already patched for LibrePuter');
      } else {
        const ans = await question(
          'Patch LibreChat to mount LibrePuter proxy? [Y/n]: ',
        );
        if (ans !== 'n' && ans !== 'N') {
          require('./patch-librechat')(resolvedLibrechat, `http://localhost:${resolvedPuterPort}`);
        }
      }
    }

    const envContent =
      `PUTER_URL=http://localhost:${resolvedPuterPort}\n` +
      `LIBRECHAT_URL=http://localhost:3080\n` +
      `LIBREPUTER_PORT=3090\n` +
      `LIBREPUTER_MODE=self-hosted\n`;

    const envPath = path.resolve(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
      fs.writeFileSync(envPath, envContent);
      console.log('  Created .env file');
    }
  } else {
    const envContent =
      `LIBRECHAT_URL=http://localhost:3080\n` +
      `LIBREPUTER_PORT=3090\n` +
      `LIBREPUTER_MODE=hosted\n`;

    const envPath = path.resolve(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
      fs.writeFileSync(envPath, envContent);
      console.log('  Created .env file (hosted/keyless mode)');
    }
  }

  console.log('');
  console.log('Setup complete!');
  console.log('');
  if (isHosted) {
    console.log('To start the keyless proxy:');
    console.log('  npm run dev -w packages/librechat-backend');
    console.log('');
    console.log('Then add the custom endpoint to librechat.yaml:');
    console.log('  (see config/librechat.yaml.example)');
    console.log('');
    console.log('Users will sign in with their Puter account when using AI.');
  } else {
    console.log('To start the LibrePuter standalone proxy:');
    console.log('  npm run dev -w packages/librechat-backend');
    console.log('');
    console.log('Make sure Puter is running first, then start LibreChat.');
  }
  console.log('');

  rl.close();
}

main().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});