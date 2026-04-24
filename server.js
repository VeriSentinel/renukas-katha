const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// ============================================
// ADMIN CREDENTIALS (Change these!)
// ============================================
const ADMIN_EMAIL = 'renuka@library.com';
const ADMIN_PASSWORD = 'moms_library_2026';

// ============================================
// MIDDLEWARE
// ============================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
  secret: 'renuka-kathas-library-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// ============================================
// FILE UPLOAD CONFIG
// ============================================
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  }
});

// ============================================
// HELPER: Read & Write Posts
// ============================================
const POSTS_FILE = path.join(__dirname, 'data', 'posts.json');

function readPosts() {
  try {
    const data = fs.readFileSync(POSTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function writePosts(posts) {
  const dir = path.dirname(POSTS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
}

// ============================================
// AUTH MIDDLEWARE
// ============================================
function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

// ============================================
// AUTH ROUTES
// ============================================
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.json({ success: true, message: 'Login successful!' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/auth/check', (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

// ============================================
// PUBLIC ROUTES - Posts
// ============================================
app.get('/api/posts', (req, res) => {
  const posts = readPosts();
  // Return posts sorted by newest first (without full content for listing)
  const listing = posts
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(p => ({
      id: p.id,
      title: p.title,
      category: p.category,
      coverImage: p.coverImage,
      createdAt: p.createdAt,
      excerpt: p.content.substring(0, 200) + (p.content.length > 200 ? '...' : '')
    }));
  res.json(listing);
});

app.get('/api/posts/:id', (req, res) => {
  const posts = readPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
});

// ============================================
// ADMIN ROUTES - CRUD
// ============================================
app.post('/api/posts', requireAuth, upload.single('coverImage'), (req, res) => {
  const posts = readPosts();
  const newPost = {
    id: Date.now().toString(),
    title: req.body.title,
    category: req.body.category,
    content: req.body.content,
    coverImage: req.file ? `/uploads/${req.file.filename}` : '',
    createdAt: new Date().toISOString()
  };
  posts.push(newPost);
  writePosts(posts);
  res.json({ success: true, post: newPost });
});

app.put('/api/posts/:id', requireAuth, upload.single('coverImage'), (req, res) => {
  const posts = readPosts();
  const index = posts.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Post not found' });

  posts[index].title = req.body.title || posts[index].title;
  posts[index].category = req.body.category || posts[index].category;
  posts[index].content = req.body.content || posts[index].content;
  if (req.file) {
    posts[index].coverImage = `/uploads/${req.file.filename}`;
  }

  writePosts(posts);
  res.json({ success: true, post: posts[index] });
});

app.delete('/api/posts/:id', requireAuth, (req, res) => {
  let posts = readPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  // Delete cover image if exists
  if (post.coverImage) {
    const imgPath = path.join(__dirname, post.coverImage);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }

  posts = posts.filter(p => p.id !== req.params.id);
  writePosts(posts);
  res.json({ success: true });
});

// ============================================
// PAGE ROUTES
// ============================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/post/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'post.html'));
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`\n  ✨ Renuka's Katha is running!`);
  console.log(`  📖 Visit: http://localhost:${PORT}`);
  console.log(`  🔐 Admin: http://localhost:${PORT}/login`);
  console.log(`  📧 Email: ${ADMIN_EMAIL}`);
  console.log(`  🔑 Password: ${ADMIN_PASSWORD}\n`);
});
