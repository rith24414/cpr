require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const UPLOADS = path.join(PUBLIC, 'uploads');
const DATABASE = path.join(__dirname, 'posts.json');

fs.mkdirSync(UPLOADS, { recursive: true });
if (!fs.existsSync(DATABASE)) fs.writeFileSync(DATABASE, '[]');

// ============================================================
// PHOTO UPLOAD (unlimited posts, each photo capped at 15MB)
// ============================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, crypto.randomUUID() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed.'));
  }
});

app.use(express.json({ limit: '1mb' }));
app.use(express.static(PUBLIC));

function readPosts() {
  try { return JSON.parse(fs.readFileSync(DATABASE, 'utf8')); }
  catch { return []; }
}
function writePosts(posts) {
  fs.writeFileSync(DATABASE, JSON.stringify(posts, null, 2));
}

app.get('/api/posts', (req, res) => {
  res.json(readPosts());
});

app.post('/api/posts', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Please choose an image.' });
  }
  const posts = readPosts();
  const post = {
    id: crypto.randomUUID(),
    imageUrl: '/uploads/' + req.file.filename,
    caption: String(req.body.caption || '').slice(0, 1000),
    createdAt: new Date().toISOString()
  };
  posts.unshift(post);
  writePosts(posts);
  res.json(post);
});

app.delete('/api/posts/:id', (req, res) => {
  const posts = readPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found.' });

  const imagePath = path.join(UPLOADS, path.basename(post.imageUrl));
  if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

  writePosts(posts.filter(p => p.id !== req.params.id));
  res.json({ ok: true });
});

// multer / generic error handler so bad uploads don't crash the process
app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message || 'Upload failed.' });
  next();
});

// ============================================================
// REAL-TIME RANDOM MATCHING (text chat + voice chat signaling)
// ============================================================
// Two independent waiting queues so text-seekers and voice-seekers
// never get accidentally paired with each other.
const waiting = { text: [], voice: [] };
// socket.id -> { socket: partnerSocket, mode }
const partners = new Map();

function removeFromQueues(socket) {
  waiting.text = waiting.text.filter(s => s.id !== socket.id);
  waiting.voice = waiting.voice.filter(s => s.id !== socket.id);
}

function tryMatch(mode) {
  const q = waiting[mode];
  while (q.length >= 2) {
    const a = q.shift();
    const b = q.shift();

    if (!a.connected) { if (b.connected) q.unshift(b); continue; }
    if (!b.connected) { q.unshift(a); continue; }

    partners.set(a.id, { socket: b, mode });
    partners.set(b.id, { socket: a, mode });

    // one side is designated "initiator" so WebRTC offer/answer doesn't collide
    a.emit('matched', { mode, initiator: true });
    b.emit('matched', { mode, initiator: false });
  }
}

function leavePartner(socket) {
  const entry = partners.get(socket.id);
  if (entry) {
    partners.delete(socket.id);
    partners.delete(entry.socket.id);
    if (entry.socket.connected) entry.socket.emit('partner-left');
  }
}

io.on('connection', (socket) => {

  socket.on('find', (mode) => {
    if (mode !== 'text' && mode !== 'voice') return;
    leavePartner(socket);
    removeFromQueues(socket);
    waiting[mode].push(socket);
    socket.emit('searching');
    tryMatch(mode);
  });

  socket.on('cancel-find', () => {
    removeFromQueues(socket);
  });

  socket.on('chat-message', (text) => {
    const entry = partners.get(socket.id);
    if (entry && entry.socket.connected) {
      entry.socket.emit('chat-message', String(text).slice(0, 2000));
    }
  });

  // WebRTC offer / answer / ICE candidates are just relayed as-is
  // between the two matched sockets.
  socket.on('signal', (data) => {
    const entry = partners.get(socket.id);
    if (entry && entry.socket.connected) {
      entry.socket.emit('signal', data);
    }
  });

  socket.on('next', () => {
    const entry = partners.get(socket.id);
    const mode = entry ? entry.mode : null;
    leavePartner(socket);
    removeFromQueues(socket);
    if (mode) {
      waiting[mode].push(socket);
      socket.emit('searching');
      tryMatch(mode);
    }
  });

  socket.on('leave', () => {
    leavePartner(socket);
    removeFromQueues(socket);
  });

  socket.on('disconnect', () => {
    leavePartner(socket);
    removeFromQueues(socket);
  });
});

server.listen(PORT, () => {
  console.log(`CPR server running at http://localhost:${PORT}`);
});
