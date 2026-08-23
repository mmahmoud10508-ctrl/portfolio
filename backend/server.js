const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'casemiro-admin-2026';
const TOKEN_COOKIE = 'admin_token';
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // أسبوع

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'data', 'content.json');

function loadContent() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return {};
  }
}
function saveContent(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ===== الجلسات =====
const sessions = new Map();

// تنظيف الجلسات المنتهية كل ساعة
setInterval(() => {
  const now = Date.now();
  for (const [t, s] of sessions) if (now - s.created > SESSION_TTL) sessions.delete(t);
}, 60 * 60 * 1000).unref();

function getCookie(req, name) {
  for (const part of (req.headers.cookie || '').split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return decodeURIComponent(part.slice(idx + 1).trim());
  }
  return null;
}

function requireAuth(req, res, next) {
  const token = getCookie(req, TOKEN_COOKIE);
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: 'غير مسجل الدخول' });
  }
  next();
}

// ===== حد لمحاولات تسجيل الدخول (5 محاولات / 10 دقايق) =====
const attempts = new Map();

function isBlocked(ip) {
  const rec = attempts.get(ip);
  if (!rec) return false;
  if (Date.now() - rec.start > 10 * 60 * 1000) {
    attempts.delete(ip);
    return false;
  }
  return rec.count >= 5;
}

function recordFail(ip) {
  const rec = attempts.get(ip);
  if (!rec || Date.now() - rec.start > 10 * 60 * 1000) {
    attempts.set(ip, { start: Date.now(), count: 1 });
  } else {
    rec.count++;
  }
}

// ===== المسارات =====
app.post('/api/login', (req, res) => {
  const ip = req.ip || 'unknown';
  if (isBlocked(ip)) {
    return res.status(429).json({ error: 'محاولات كتير غلط... استنى 10 دقايق' });
  }
  const { password } = req.body || {};
  const a = Buffer.from(String(password ?? ''));
  const b = Buffer.from(ADMIN_PASSWORD);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!ok) {
    recordFail(ip);
    return res.status(401).json({ error: 'كلمة السر غلط' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { created: Date.now() });
  res.setHeader('Set-Cookie',
    `${TOKEN_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL / 1000}`);
  res.json({ ok: true });
});

app.post('/api/logout', (req, res) => {
  const token = getCookie(req, TOKEN_COOKIE);
  if (token) sessions.delete(token);
  res.setHeader('Set-Cookie', `${TOKEN_COOKIE}=; HttpOnly; Path=/; Max-Age=0`);
  res.json({ ok: true });
});

app.get('/api/session', requireAuth, (req, res) => res.json({ ok: true }));

app.get('/api/content', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(loadContent());
});

app.post('/api/content', requireAuth, (req, res) => {
  const c = req.body;
  if (!c || typeof c !== 'object' || Array.isArray(c)) {
    return res.status(400).json({ error: 'بيانات غير صالحة' });
  }
  saveContent(c);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`✅ Server running: http://localhost:${PORT}`);
  console.log(`🔐 Admin panel:   http://localhost:${PORT}/admin.html`);
});
