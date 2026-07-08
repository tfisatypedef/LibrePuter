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
  console.log('║         LibrePuter Setup                     ║');
  console.log('╚═══════════════════════════════════════════════╝');
  console.log('');
  console.log('LibrePuter bridges 500+ AI models into LibreChat via Puter.');
  console.log('Users provide their own Puter auth token — no API keys for you.');
  console.log('');

  const mode = await question(
    `Proxy mode? (hosted = keyless via api.puter.com, self-hosted = your own Puter) [hosted]: `,
  );
  const resolvedMode = (mode || 'hosted').trim().toLowerCase();
  const isHosted = resolvedMode === 'hosted' || resolvedMode === '';

  if (!isHosted) {
    const puterPort = await question(`Puter server port [4100]: `);
    const resolvedPuterPort = puterPort || '4100';

    const envContent =
      `PUTER_URL=http://localhost:${resolvedPuterPort}\n` +
      `LIBRECHAT_URL=http://localhost:3080\n` +
      `LIBREPUTER_PORT=3090\n` +
      `LIBREPUTER_MODE=self-hosted\n`;

    const envPath = path.resolve(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
      fs.writeFileSync(envPath, envContent);
      console.log('  Created .env file (self-hosted mode)');
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
    console.log('To start:');
    console.log('  npm run dev -w packages/librechat-backend');
    console.log('');
    console.log('Then add to librechat.yaml:');
    console.log('  (see config/librechat.yaml.example)');
    console.log('');
    console.log('Users will paste their Puter auth token as the API key in LibreChat.');
  } else {
    console.log('To start:');
    console.log('  npm run dev -w packages/librechat-backend');
    console.log('');
    console.log('Make sure Puter is running first. Users provide their own Puter auth token.');
  }
  console.log('');

  rl.close();
}

main().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});