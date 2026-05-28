const express = require('express');
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
    ws.send('\r\n\x1b[31mUnauthorized.\x1b[0m\r\n');
    ws.close();
    return;
  }
  // Windows - spawn PowerShell
  const shell = pty.spawn('powershell.exe', [], {
    name: 'xterm-color',
    cols: 120,
    rows: 35,
    cwd: 'C:\\Users\\Administrator',
    env: process.env
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

server.listen(PORT, '127.0.0.1', () => console.log('Stonyx CLI Terminal running at http://127.0.0.1:' + PORT));
