#!/usr/bin/env node
/**
 * setup-cli-terminal.js
 * Creates the CLI terminal app (server.js + index.html) and starts it with PM2
 * Usage: node setup-cli-terminal.js <machine-name>
 * Example: node setup-cli-terminal.js skywork2
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const machineName = process.argv[2] || 'Skywork';
const homeDir = process.env.HOME || '/home/ubuntu';
const cliDir = path.join(homeDir, 'cli-terminal');

function run(cmd, opts = {}) {
  console.log('$', cmd);
  try { execSync(cmd, { stdio: 'inherit', ...opts }); } catch(e) { console.error('Error:', e.message); }
}

// Create directory
fs.mkdirSync(cliDir, { recursive: true });

// Write package.json
fs.writeFileSync(path.join(cliDir, 'package.json'), JSON.stringify({
  name: 'cli-terminal', version: '1.0.0', main: 'server.js',
  scripts: { start: 'node server.js' }
}, null, 2));

// Write server.js
const serverJs = `const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const pty = require('node-pty');
const path = require('path');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 4000;
const PASSWORD = process.env.CLI_PASSWORD || 'AxelCLI2026!';
const SESSIONS = new Set();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/auth', (req, res) => {
  if (req.body.password === PASSWORD) {
    const token = crypto.randomBytes(32).toString('hex');
    SESSIONS.add(token);
    setTimeout(() => SESSIONS.delete(token), 24 * 60 * 60 * 1000);
    res.json({ ok: true, token });
  } else { res.status(401).json({ ok: false, error: 'Wrong password' }); }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost');
  const token = url.searchParams.get('token');
  if (!SESSIONS.has(token)) {
    ws.send('\\r\\n\\x1b[31mUnauthorized.\\x1b[0m\\r\\n');
    ws.close();
    return;
  }
  const shell = pty.spawn('bash', [], {
    name: 'xterm-color', cols: 120, rows: 35,
    cwd: '/home/ubuntu', env: process.env
  });
  shell.onData(data => { if (ws.readyState === WebSocket.OPEN) ws.send(data); });
  ws.on('message', msg => {
    try {
      const m = JSON.parse(msg);
      if (m.type === 'resize') shell.resize(m.cols, m.rows);
      else if (m.type === 'input') shell.write(m.data);
    } catch { shell.write(msg); }
  });
  ws.on('close', () => shell.kill());
  shell.onExit(() => { if (ws.readyState === WebSocket.OPEN) ws.close(); });
});

server.listen(PORT, '127.0.0.1', () => console.log('CLI Terminal running at http://127.0.0.1:' + PORT));
`;

fs.writeFileSync(path.join(cliDir, 'server.js'), serverJs);
console.log('Created server.js');

// Write index.html
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${machineName} CLI</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/xterm@5.3.0/css/xterm.css"/>
<script src="https://cdn.jsdelivr.net/npm/xterm@5.3.0/lib/xterm.js"></script>
<script src="https://cdn.jsdelivr.net/npm/xterm-addon-fit@0.8.0/lib/xterm-addon-fit.js"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d0d14;color:#e0e0e0;font-family:sans-serif;height:100vh;display:flex;flex-direction:column}
#login{display:flex;align-items:center;justify-content:center;height:100vh}
.login-box{background:#1a1a2e;border:1px solid #2a2a4a;border-radius:12px;padding:2.5rem;width:360px;text-align:center}
.login-box h1{font-size:1.5rem;color:#fff;margin-bottom:.25rem}
.login-box p{font-size:.85rem;color:#888;margin-bottom:1.5rem}
.login-box input{width:100%;padding:.75rem 1rem;background:#0d0d14;border:1px solid #2a2a4a;border-radius:8px;color:#fff;font-size:.95rem;margin-bottom:1rem;outline:none}
.login-box button{width:100%;padding:.75rem;background:#5b8af5;color:#fff;border:none;border-radius:8px;font-size:1rem;font-weight:600;cursor:pointer}
#login-error{color:#ff6b6b;font-size:.85rem;margin-top:.75rem}
#app{display:none;flex-direction:column;height:100vh}
.topbar{background:#1a1a2e;border-bottom:1px solid #2a2a4a;padding:.6rem 1rem;display:flex;align-items:center;gap:.75rem;flex-wrap:wrap}
.topbar-title{font-weight:700;font-size:.95rem;color:#5b8af5}
.quick-btn{padding:.35rem .85rem;border-radius:6px;border:1px solid #2a2a4a;background:#0d0d14;color:#ccc;font-size:.78rem;cursor:pointer}
.quick-btn:hover{background:#1e1e38;border-color:#5b8af5;color:#fff}
.terminal-wrap{flex:1;padding:.5rem;overflow:hidden}
#terminal{height:100%}
</style>
</head>
<body>
<div id="login">
  <div class="login-box">
    <h1>${machineName} CLI</h1>
    <p>Remote terminal access</p>
    <input type="password" id="pw" placeholder="Password" onkeydown="if(event.key==='Enter')doLogin()" autofocus/>
    <button onclick="doLogin()">Connect</button>
    <div id="login-error"></div>
  </div>
</div>
<div id="app">
  <div class="topbar">
    <span class="topbar-title">${machineName} CLI</span>
    <button class="quick-btn" onclick="run('openclaw gateway status')">Gateway Status</button>
    <button class="quick-btn" onclick="run('openclaw gateway restart')">Restart Gateway</button>
    <button class="quick-btn" onclick="run('openclaw devices approve --latest')">Approve Device</button>
    <button class="quick-btn" onclick="run('pm2 status')">PM2 Status</button>
    <button class="quick-btn" onclick="run('sudo systemctl status cloudflared')">Tunnel Status</button>
  </div>
  <div class="terminal-wrap"><div id="terminal"></div></div>
</div>
<script>
let ws,term,fitAddon,authToken;
async function doLogin(){
  const pw=document.getElementById('pw').value;
  const err=document.getElementById('login-error');
  err.textContent='';
  try{
    const res=await fetch('/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:pw})});
    const data=await res.json();
    if(data.ok){authToken=data.token;startTerminal();}
    else{err.textContent='Wrong password.';}
  }catch(e){err.textContent='Connection error.';}
}
function startTerminal(){
  document.getElementById('login').style.display='none';
  document.getElementById('app').style.display='flex';
  term=new Terminal({theme:{background:'#0d0d14',foreground:'#e0e0e0',cursor:'#5b8af5'},fontFamily:'Consolas,monospace',fontSize:14,cursorBlink:true,scrollback:1000});
  fitAddon=new FitAddon.FitAddon();
  term.loadAddon(fitAddon);
  term.open(document.getElementById('terminal'));
  fitAddon.fit();
  const proto=location.protocol==='https:'?'wss':'ws';
  ws=new WebSocket(proto+'://'+location.host+'/?token='+authToken);
  ws.onopen=()=>term.writeln('\\x1b[32mConnected to ${machineName} CLI\\x1b[0m\\r\\n');
  ws.onmessage=e=>term.write(e.data);
  ws.onclose=()=>term.writeln('\\r\\n\\x1b[31mConnection closed.\\x1b[0m');
  term.onData(data=>ws.send(JSON.stringify({type:'input',data})));
  term.onResize(({cols,rows})=>ws.send(JSON.stringify({type:'resize',cols,rows})));
  window.addEventListener('resize',()=>fitAddon.fit());
}
function run(cmd){if(ws&&ws.readyState===WebSocket.OPEN){ws.send(JSON.stringify({type:'input',data:cmd+'\\r'}));term.focus();}}
</script>
</body>
</html>`;

fs.writeFileSync(path.join(cliDir, 'index.html'), indexHtml);
console.log('Created index.html');

// Install dependencies and start
run('npm install', { cwd: cliDir });
run('npm install -g pm2');
run(`pm2 start ${path.join(cliDir, 'server.js')} --name cli-terminal`);
run('pm2 save');

console.log(`\nDone! CLI terminal running on port 4000`);
console.log(`Password: AxelCLI2026!`);
console.log(`\nRun 'pm2 startup' and execute the output command to start on reboot.`);
