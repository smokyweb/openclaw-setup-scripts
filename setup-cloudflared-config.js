#!/usr/bin/env node
/**
 * setup-cloudflared-config.js
 * Run on new OpenClaw Ubuntu machine to create cloudflared config
 * Usage: node setup-cloudflared-config.js <tunnel-id> <machine-name>
 * Example: node setup-cloudflared-config.js d98e7381-ef76-4ff2-acc3-85968581316b skywork2
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const tunnelId = process.argv[2];
const machineName = process.argv[3];

if (!tunnelId || !machineName) {
  console.error('Usage: node setup-cloudflared-config.js <tunnel-id> <machine-name>');
  process.exit(1);
}

const homeDir = process.env.HOME || '/home/ubuntu';
const cfDir = path.join(homeDir, '.cloudflared');

// Create .cloudflared directory
fs.mkdirSync(cfDir, { recursive: true });

// Write config.yml
const config = `tunnel: ${tunnelId}
credentials-file: ${cfDir}/${tunnelId}.json

ingress:
  - hostname: ${machineName}.batmanbluestone.com
    service: http://localhost:18789
  - hostname: ${machineName}-cli.batmanbluestone.com
    service: http://localhost:4000
  - service: http_status:404
`;

fs.writeFileSync(path.join(cfDir, 'config.yml'), config);
console.log('Created:', path.join(cfDir, 'config.yml'));
console.log('Contents:');
console.log(config);
