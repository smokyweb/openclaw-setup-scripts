#!/usr/bin/env node
/**
 * setup-openclaw-gateway.js
 * Configures OpenClaw gateway for remote access via Cloudflare tunnel
 * Usage: node setup-openclaw-gateway.js <machine-name>
 * Example: node setup-openclaw-gateway.js skywork2
 */
const fs = require('fs');
const { execSync } = require('child_process');

const machineName = process.argv[2];
if (!machineName) {
  console.error('Usage: node setup-openclaw-gateway.js <machine-name>');
  process.exit(1);
}

const homeDir = process.env.HOME || '/home/ubuntu';
const configPath = homeDir + '/.openclaw/openclaw.json';

if (!fs.existsSync(configPath)) {
  console.error('OpenClaw config not found at', configPath);
  console.error('Make sure OpenClaw is installed and has been run at least once.');
  process.exit(1);
}

let raw = fs.readFileSync(configPath, 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const cfg = JSON.parse(raw);

// Set bind to loopback (required for security)
cfg.gateway = cfg.gateway || {};
cfg.gateway.bind = 'loopback';

// Add allowed origin for webchat
cfg.gateway.controlUi = cfg.gateway.controlUi || {};
cfg.gateway.controlUi.allowedOrigins = cfg.gateway.controlUi.allowedOrigins || [];
const origin = `https://${machineName}.batmanbluestone.com`;
if (!cfg.gateway.controlUi.allowedOrigins.includes(origin)) {
  cfg.gateway.controlUi.allowedOrigins.push(origin);
}

fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2));
console.log('Gateway configured:');
console.log('  bind:', cfg.gateway.bind);
console.log('  allowedOrigins:', cfg.gateway.controlUi.allowedOrigins);

// Restart gateway
try {
  execSync('openclaw gateway restart', { stdio: 'inherit' });
} catch(e) {
  console.log('Gateway restart may need a moment...');
}

console.log('\nDone! OpenClaw gateway configured for', origin);
console.log('\nNext steps:');
console.log('1. Tell Axel: "Set up Cloudflare Access for', machineName, 'and', machineName + '-cli"');
console.log('2. Open', origin, 'in your browser');
console.log('3. Enter your email, get the code, log in');
console.log('4. Enter gateway token (find it in ~/.openclaw/openclaw.json under gateway.auth.token)');
console.log('5. Run: openclaw devices approve --latest');
