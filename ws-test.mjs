import { WebSocket } from 'ws';

const ws = new WebSocket('ws://127.0.0.1:3001/ws');

const t = setTimeout(() => {
  console.log('TIMEOUT (no open/error in 3s)');
  try { ws.terminate(); } catch {}
  process.exit(0);
}, 3000);

ws.on('open', () => { console.log('OPEN'); clearTimeout(t); ws.close(); });
ws.on('unexpected-response', (req, res) => {
  console.log('UNEXPECTED', res.statusCode, res.statusMessage);
  clearTimeout(t);
  process.exit(0);
});
ws.on('error', (err) => { console.log('ERROR', err.message); clearTimeout(t); process.exit(0); });
ws.on('close', (code, reason) => { console.log('CLOSE', code, reason?.toString()); clearTimeout(t); process.exit(0); });
