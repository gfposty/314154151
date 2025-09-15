// Simple Socket.IO mediator server (no client IP exposure to other clients)
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors({ origin: '*', methods: ['GET','POST','OPTIONS'], allowedHeaders: ['Content-Type','x-admin-key'] }));
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*'},
});

// Very simple queue-based matcher: pairs first two waiting sockets
let waiting = null; // { socket, prefs }
let reports = []; // in-memory storage (persisted)
const ADMIN_KEY = process.env.ADMIN_KEY || 'dev-admin';

// Sanctions store: keyed by IP
// status: 'none' | 'mute' | 'ban'
// banType: '15m' | '3d' | 'forever'
const sanctions = new Map();

// --- Persistence (simple JSON file) ---
const dbPath = path.join(__dirname, 'data.json');

function loadDB() {
  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, 'utf-8');
      const parsed = JSON.parse(raw || '{}');
      if (Array.isArray(parsed.reports)) reports = parsed.reports;
      if (Array.isArray(parsed.sanctions)) {
        parsed.sanctions.forEach(s => {
          if (s && s.ip) sanctions.set(s.ip, s);
        });
      }
    }
  } catch {}
}

function saveDB() {
  const data = {
    reports,
    sanctions: Array.from(sanctions.values()),
  };
  fs.writeFile(dbPath, JSON.stringify(data, null, 2), () => {});
}

loadDB();

function getClientIpFromReq(req) {
  const xf = req.headers['x-forwarded-for'];
  let ip = (Array.isArray(xf) ? xf[0] : (xf || '')).split(',')[0].trim();
  if (!ip) ip = req.socket.remoteAddress || '';
  return ip.replace('::ffff:', '');
}

function getClientIpFromSocket(socket) {
  const xf = socket.handshake.headers['x-forwarded-for'];
  let ip = (Array.isArray(xf) ? xf[0] : (xf || '')).split(',')[0].trim();
  if (!ip) ip = socket.handshake.address || '';
  return ip.replace('::ffff:', '');
}

function isSanctionActive(entry) {
  if (!entry) return false;
  if (entry.banType === 'forever') return true;
  return entry.expiresAt && Date.now() < entry.expiresAt;
}

function canSend(ip) {
  const s = sanctions.get(ip);
  if (!s) return true;
  if (!isSanctionActive(s)) return true;
  return s.status !== 'mute' && s.status !== 'ban' ? true : (s.status === 'mute' ? false : false);
}

function applySanction(ip, banType) {
  const now = Date.now();
  let expiresAt = null;
  let status = 'ban';
  if (banType === '15m') {
    status = 'mute';
    expiresAt = now + 15 * 60 * 1000;
  } else if (banType === '3d') {
    status = 'ban';
    expiresAt = now + 3 * 24 * 60 * 60 * 1000;
  } else if (banType === 'forever') {
    status = 'ban';
    expiresAt = null;
  }
  const prev = sanctions.get(ip) || { history: [] };
  const updated = { ...prev, ip, status, banType, expiresAt, history: [...(prev.history||[]), { at: now, type: banType, until: expiresAt }] };
  sanctions.set(ip, updated);
  saveDB();
  return updated;
}

function clearSanction(ip) {
  sanctions.delete(ip);
  saveDB();
}

function pairSockets(a, b) {
  a.partner = b.id;
  b.partner = a.id;
  a.emit('matched');
  b.emit('matched');
}

io.on('connection', (socket) => {
  socket.partner = null;
  socket.clientIp = getClientIpFromSocket(socket);
  // Disconnect immediately if currently banned
  const s = sanctions.get(socket.clientIp);
  if (isSanctionActive(s) && s.status === 'ban') {
    socket.emit('end');
    setTimeout(() => socket.disconnect(true), 50);
    return;
  }

  socket.on('find_partner', (prefs) => {
    if (waiting && waiting.socket.connected) {
      const other = waiting.socket;
      waiting = null;
      pairSockets(socket, other);
    } else {
      waiting = { socket, prefs };
    }
  });

  socket.on('message', (payload) => {
    if (!socket.partner) return;
    // Mute/ban enforcement
    const ip = socket.clientIp;
    if (!canSend(ip)) return; // silently drop if muted/banned
    io.to(socket.partner).emit('message', payload);
  });

  socket.on('next', () => {
    if (socket.partner) {
      io.to(socket.partner).emit('end');
      const partner = io.sockets.sockets.get(socket.partner);
      if (partner) partner.partner = null;
      socket.partner = null;
    }
    socket.emit('matched');
  });

  socket.on('end', () => {
    if (socket.partner) {
      io.to(socket.partner).emit('end');
      const partner = io.sockets.sockets.get(socket.partner);
      if (partner) partner.partner = null;
      socket.partner = null;
    }
  });

  socket.on('disconnect', () => {
    if (waiting && waiting.socket.id === socket.id) waiting = null;
    if (socket.partner) {
      io.to(socket.partner).emit('end');
      const partner = io.sockets.sockets.get(socket.partner);
      if (partner) partner.partner = null;
    }
  });
});

// Admin/report APIs
app.post('/api/report', (req, res) => {
  const report = { id: Date.now().toString(), createdAt: Date.now(), ip: getClientIpFromReq(req), ...req.body };
  reports.push(report);
  saveDB();
  res.json({ ok: true, id: report.id });
});

function checkAdmin(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!key || key !== ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

app.get('/api/admin/reports', checkAdmin, (_req, res) => {
  res.json({ reports });
});

app.get('/api/admin/reports/:id', checkAdmin, (req, res) => {
  const r = reports.find(x => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Not found' });
  res.json(r);
});

// Sanction management endpoints
app.post('/api/admin/sanction', checkAdmin, (req, res) => {
  const { ip, type } = req.body || {};
  if (!ip || !type) return res.status(400).json({ error: 'ip and type required' });
  const s = applySanction(ip, type);
  res.json({ ok: true, sanction: s });
});

app.post('/api/admin/unban', checkAdmin, (req, res) => {
  const { ip } = req.body || {};
  if (!ip) return res.status(400).json({ error: 'ip required' });
  clearSanction(ip);
  res.json({ ok: true });
});

app.get('/api/admin/banned', checkAdmin, (_req, res) => {
  const list = Array.from(sanctions.values()).map(s => ({ ip: s.ip, status: s.status, banType: s.banType, expiresAt: s.expiresAt, history: s.history||[] }));
  res.json({ banned: list });
});

// Public endpoint: returns sanction status for caller IP
app.get('/api/sanction/me', (req, res) => {
  const ip = getClientIpFromReq(req);
  const s = sanctions.get(ip);
  if (!isSanctionActive(s)) return res.json({ active: false });
  return res.json({ active: true, status: s.status, banType: s.banType, expiresAt: s.expiresAt });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log('Mediator server running on port', PORT);
});


