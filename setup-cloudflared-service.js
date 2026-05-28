#!/usr/bin/env node
/**
 * setup-cloudflared-service.js
 * Copies cloudflared config to /etc/cloudflared and installs as system service
 * Run with sudo: sudo node setup-cloudflared-service.js <tunnel-id>
 * Example: sudo node setup-cloudflared-service.js d98e7381-ef76-4ff2-acc3-85968581316b
 */
const fs = require('fs');
const { execSync } = require('child_process');

const tunnelId = process.argv[2];
if (!tunnelId) {
  console.error('Usage: sudo node setup-cloudflared-service.js <tunnel-id>');
  process.exit(1);
}

const homeDir = '/home/ubuntu';
const cfDir = homeDir + '/.cloudflared';

function run(cmd) {
  console.log('$', cmd);
  try { execSync(cmd, { stdio: 'inherit' }); } catch(e) { console.error('Error:', e.message); }
}

// Copy files to /etc/cloudflared
run('mkdir -p /etc/cloudflared');
run(`cp ${cfDir}/config.yml /etc/cloudflared/config.yml`);
run(`cp ${cfDir}/${tunnelId}.json /etc/cloudflared/${tunnelId}.json`);
run(`cp ${cfDir}/cert.pem /etc/cloudflared/cert.pem`);

// Update paths in config
run(`sed -i 's|${cfDir}/|/etc/cloudflared/|g' /etc/cloudflared/config.yml`);

console.log('\nUpdated config:');
console.log(fs.readFileSync('/etc/cloudflared/config.yml', 'utf8'));

// Install and start service
run('cloudflared service install');
run('systemctl enable cloudflared');
run('systemctl start cloudflared');
run('systemctl status cloudflared --no-pager');

console.log('\nDone! Cloudflared tunnel is running as a system service.');
