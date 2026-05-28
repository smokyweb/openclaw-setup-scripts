#!/usr/bin/env node
/**
 * fix-skill-paths.js
 * Updates all skill files to use the correct home directory for this machine
 * Usage: node fix-skill-paths.js
 * Run after uploading skills from another machine
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const homeDir = os.homedir();
const skillsDir = path.join(homeDir, '.openclaw', 'skills');

// Detect old paths to replace
const OLD_PATHS = [
  'C:\\\\Users\\\\kevin\\\\.openclaw',
  'C:/Users/kevin/.openclaw',
  '/home/ubuntu/.openclaw',  // in case copied from another Ubuntu machine
  '/root/.openclaw',
];

const NEW_PATH = path.join(homeDir, '.openclaw').replace(/\\/g, '/');

if (!fs.existsSync(skillsDir)) {
  console.error('Skills directory not found:', skillsDir);
  console.error('Make sure skills are installed at', skillsDir);
  process.exit(1);
}

let filesUpdated = 0;
let replacements = 0;

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.json') || entry.name.endsWith('.js'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const oldPath of OLD_PATHS) {
        if (content.includes(oldPath)) {
          content = content.split(oldPath).join(NEW_PATH);
          changed = true;
          replacements++;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content);
        filesUpdated++;
        console.log('Updated:', fullPath.replace(skillsDir, ''));
      }
    }
  }
}

console.log('Scanning skills directory:', skillsDir);
console.log('New home path:', NEW_PATH);
console.log('');

processDir(skillsDir);

console.log(`\nDone! Updated ${filesUpdated} files with ${replacements} path replacements.`);
if (filesUpdated === 0) {
  console.log('No path updates needed — skills are already configured for this machine.');
}
