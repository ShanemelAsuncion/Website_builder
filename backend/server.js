// Derive asset base from request (works behind proxies/CDNs)
function getAssetBase(req) {
  try {
    const xfProto = (req.headers['x-forwarded-proto'] || '').toString().split(',')[0].trim();
    const xfHost = (req.headers['x-forwarded-host'] || '').toString().split(',')[0].trim();
    if (xfProto && xfHost) {
      return `${xfProto}://${xfHost}`.replace(/\/$/, '');
    }
  } catch {}
  try {
    const host = req.get('host');
    if (host) return `${req.protocol}://${host}`.replace(/\/$/, '');
  } catch {}
  return (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
}

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initialContent } from './seedData.js';
import { sendContactEmail, sendVerificationEmail, sendPasswordResetEmail } from './email.js';
import crypto from 'crypto';
import sharp from 'sharp';
import supabase from './supabaseClient.js';

// Configure dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Database } = sqlite3.verbose();

const app = express();
// Behind a reverse proxy (Render, Netlify, etc.), trust X-Forwarded-* headers
// This prevents express-rate-limit from throwing ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
// and ensures req.protocol/req.ip are derived correctly.
app.set('trust proxy', true);
const PORT = process.env.PORT || 5000;

// Use a consistent JWT secret for development
// This secret is used for both signing and verifying tokens
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-1234567890';
const JWT_EXPIRES_IN = '1h';

console.log('Server starting with JWT configuration:', {
  JWT_SECRET: JWT_SECRET ? '*** (set)' : 'NOT SET!',
  JWT_EXPIRES_IN
});

// Redirect helper for legacy emails that point to backend host
app.get('/reset-password', (req, res) => {
  try {
    const origin = process.env.SITE_URL || 'http://localhost:3000';
    const search = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    const target = `${origin.replace(/\/$/, '')}/reset-password${search}`;
    return res.redirect(302, target);
  } catch (e) {
    console.error('reset-password redirect error:', e);
    return res.status(500).send('Redirect failed');
  }
});

// (forgot-password route will be defined after middleware)

// (email change routes are defined after auth routes below)

// (admin user routes moved below after auth is defined)

// Middleware
app.use(helmet({
  // Disable CSP for dev to avoid blocking Vite assets and cross-origin resources
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Global basic rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use(globalLimiter);
// CORS allowlist: configurable via FRONTEND_ORIGINS (comma-separated), with sensible local defaults
const DEFAULT_ORIGINS = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'];
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
app.use(cors({
  origin: FRONTEND_ORIGINS.length ? FRONTEND_ORIGINS : DEFAULT_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(bodyParser.json());

// Forgot Password: send reset email (after middleware so CORS/JSON parsing apply)
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Optional branding lookup from content table
    let brandName, logoUrl;
    try {
      const row = await db.get("SELECT value FROM content WHERE key = 'branding'");
      if (row?.value) {
        const parsed = JSON.parse(row.value);
        brandName = parsed?.name;
        logoUrl = parsed?.logoUrl;
      }
    } catch {}

    // Always respond generically to avoid enumeration
    const genericResponse = { message: 'If an account exists for this email, a reset link has been sent.' };

    // Find user
    const user = await db.get('SELECT id, email FROM users WHERE email = ?', [email]);
    if (!user) {
      // Still respond OK without indicating existence
      try {
        const origin = req.headers.origin || process.env.SITE_URL || 'http://localhost:3000';
        const assetBase = getAssetBase(req);
        await sendPasswordResetEmail({
          to: email,
          userName: email.split('@')[0],
          brandName,
          supportEmail: process.env.SUPPORT_EMAIL,
          siteUrl: origin,
          logoUrl,
          assetBase,
        });
      } catch (e) {
        console.warn('Attempted to send reset email for non-existing user:', e.message);
      }
      return res.json(genericResponse);
    }

    // Create a short-lived token (e.g., 1 hour)
    const token = jwt.sign({ userId: user.id, purpose: 'password-reset' }, JWT_SECRET, { expiresIn: '1h' });
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    try {
      // Upsert: delete existing tokens for user to keep only latest
      await db.run('DELETE FROM password_reset_tokens WHERE userId = ?', [user.id]);
    } catch {}
    await db.run('INSERT INTO password_reset_tokens (userId, token, expiresAt) VALUES (?, ?, ?)', [user.id, token, expiresAt]);

    const origin = req.headers.origin || process.env.SITE_URL || 'http://localhost:3000';
    const resetUrl = `${origin.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;

    // Send email
    try {
      await sendPasswordResetEmail({
        to: email,
        userName: email.split('@')[0],
        brandName,
        supportEmail: process.env.SUPPORT_EMAIL,
        siteUrl: origin,
        logoUrl,
        assetBase: getAssetBase(req),
        resetUrl,
      });
    } catch (e) {
      console.warn('Failed to send password reset email (continuing):', e.message);
    }

    return res.json(genericResponse);
  } catch (e) {
    console.error('forgot-password error:', e);
    return res.status(500).json({ error: 'Failed to process request' });
  }
});

// Reset password: apply new password using a valid token
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and newPassword are required' });

    // Verify token signature
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    if (payload.purpose !== 'password-reset') return res.status(400).json({ error: 'Invalid token purpose' });

    // Ensure token exists in DB and not expired
    const row = await db.get('SELECT * FROM password_reset_tokens WHERE token = ?', [token]);
    if (!row) return res.status(400).json({ error: 'Invalid or used token' });
    if (new Date(row.expiresAt) < new Date()) return res.status(400).json({ error: 'Token expired' });

    // Update user password
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.run('UPDATE users SET password = ? WHERE id = ?', [hashed, row.userId]);

    // Invalidate token
    await db.run('DELETE FROM password_reset_tokens WHERE id = ?', [row.id]);

    return res.json({ message: 'Password has been reset successfully.' });
  } catch (e) {
    console.error('reset-password error:', e);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Static hosting for uploaded files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir));

// Configure multer storage for uploads
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (_req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '';
    cb(null, `${unique}${ext}`);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// Uploads directory capacity limits (to protect free tier quotas)
const UPLOADS_MAX_BYTES = Number(process.env.UPLOADS_MAX_BYTES || 20 * 1024 * 1024); // 20MB default
const UPLOADS_KEEP_MIN = Number(process.env.UPLOADS_KEEP_MIN || 10); // always keep at least N newest files

// Helpers for uploads maintenance
function getAllUploadFiles() {
  try {
    const names = fs.readdirSync(uploadsDir).filter(n => !n.startsWith('.'));
    return names.map(name => ({ name, abs: path.join(uploadsDir, name) }))
      .filter(f => {
        try { return fs.statSync(f.abs).isFile(); } catch { return false; }
      });
  } catch {
    return [];
  }
}

function getUploadsDirSize() {
  return getAllUploadFiles().reduce((sum, f) => {
    try { return sum + fs.statSync(f.abs).size; } catch { return sum; }
  }, 0);
}

function hashFileSync(absPath) {
  const hash = crypto.createHash('sha256');
  const buf = fs.readFileSync(absPath);
  hash.update(buf);
  return hash.digest('hex');
}

async function getReferencedUploadFilenames() {
  // Scan the content table JSON for any '/uploads/<file>' references
  const rows = await db.all('SELECT key, value FROM content');
  const refs = new Set();
  const regex = /\/(?:uploads)\/(\S+?)(?=["'\]\s}>)])/g; // capture filenames after /uploads/
  for (const row of rows) {
    const text = String(row.value || '');
    let m;
    while ((m = regex.exec(text)) !== null) {
      if (m[1]) refs.add(m[1]);
    }
    // Also try to parse JSON and look for logoUrl-like fields
    try {
      const parsed = JSON.parse(row.value);
      const stack = [parsed];
      while (stack.length) {
        const cur = stack.pop();
        if (typeof cur === 'string') {
          const u = cur;
          const match = u.match(/\/(?:uploads)\/([^\s"']+)/);
          if (match && match[1]) refs.add(match[1]);
        } else if (Array.isArray(cur)) {
          for (const v of cur) stack.push(v);
        } else if (cur && typeof cur === 'object') {
          for (const k of Object.keys(cur)) stack.push(cur[k]);
        }
      }
    } catch {}
  }
  return refs;
}

async function cleanupUploadsInternal({ dryRun = false } = {}) {
  const report = {
    totalBeforeBytes: getUploadsDirSize(),
    deletedUnreferenced: [],
    deletedDuplicates: [],
    kept: [],
    errors: [],
  };

  const files = getAllUploadFiles()
    .map(f => ({ ...f, stat: fs.statSync(f.abs) }))
    .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs); // newest first

  // Build referenced set
  let referenced = new Set();
  try {
    referenced = await getReferencedUploadFilenames();
  } catch (e) {
    report.errors.push(`Failed to read references: ${e.message}`);
  }

  // Detect duplicates by hash (keep newest copy)
  const seenByHash = new Map();
  for (const f of files) {
    try {
      const h = hashFileSync(f.abs);
      if (seenByHash.has(h)) {
        // duplicate
        if (!dryRun) fs.unlinkSync(f.abs);
        report.deletedDuplicates.push(f.name);
        continue;
      }
      seenByHash.set(h, f.name);
    } catch (e) {
      report.errors.push(`Hash error for ${f.name}: ${e.message}`);
    }
  }

  // Recompute files list after duplicate removal
  const postDupFiles = getAllUploadFiles().map(f => ({ ...f, stat: fs.statSync(f.abs) }));

  // Remove unreferenced files (preserve newest UPLOADS_KEEP_MIN files as safety)
  const sorted = [...postDupFiles].sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);
  const preserve = new Set(sorted.slice(0, Math.max(0, UPLOADS_KEEP_MIN)).map(f => f.name));
  for (const f of sorted) {
    if (preserve.has(f.name)) { report.kept.push(f.name); continue; }
    if (!referenced.has(f.name)) {
      try {
        if (!dryRun) fs.unlinkSync(f.abs);
        report.deletedUnreferenced.push(f.name);
      } catch (e) {
        report.errors.push(`Delete error for ${f.name}: ${e.message}`);
      }
    } else {
      report.kept.push(f.name);
    }
  }

  report.totalAfterBytes = getUploadsDirSize();
  return report;
}

// Per-route strict limiters
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// Database setup
let db;

async function initializeDatabase() {
  try {
    // Open the SQLite database
    db = await open({
      filename: './database.sqlite',
      driver: Database
    });

    // Create users table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        isMaster INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration: ensure isMaster column exists
    try {
      const cols = await db.all(`PRAGMA table_info(users)`);
      const hasIsMaster = cols.some(c => c.name === 'isMaster');
      if (!hasIsMaster) {
        await db.exec(`ALTER TABLE users ADD COLUMN isMaster INTEGER DEFAULT 0`);
        console.log('Migrated users table: added isMaster column');
      }
    } catch (e) {
      console.warn('Migration check for users table failed:', e.message);
    }

    // Ensure email change requests table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS email_change_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        newEmail TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expiresAt DATETIME NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    // Ensure password reset tokens table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expiresAt DATETIME NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      )
    `);

    // Create content table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        type TEXT NOT NULL,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Connected to SQLite database and initialized tables');
    return db;
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  }
}

// Seed the database with initial content if it's empty
async function seedDatabase() {
  try {
    const count = await db.get('SELECT COUNT(*) as count FROM content');
    if (count.count === 0) {
      console.log('Content table is empty, seeding initial data...');
      
      // Seed testimonials
      await db.run(
        'INSERT INTO content (key, value, type) VALUES (?, ?, ?)',
        ['testimonials', JSON.stringify(initialContent.testimonials), 'json']
      );

      // Seed hero content
      await db.run(
        'INSERT INTO content (key, value, type) VALUES (?, ?, ?)',
        ['hero.summer', JSON.stringify(initialContent.hero.summer), 'json']
      );
      await db.run(
        'INSERT INTO content (key, value, type) VALUES (?, ?, ?)',
        ['hero.winter', JSON.stringify(initialContent.hero.winter), 'json']
      );

      // Seed services
      await db.run(
        'INSERT INTO content (key, value, type) VALUES (?, ?, ?)',
        ['services.summer', JSON.stringify(initialContent.services.summer), 'json']
      );
      await db.run(
        'INSERT INTO content (key, value, type) VALUES (?, ?, ?)',
        ['services.winter', JSON.stringify(initialContent.services.winter), 'json']
      );

      // Seed summer portfolio
      await db.run(
        'INSERT INTO content (key, value, type) VALUES (?, ?, ?)',
        ['portfolio.summer', JSON.stringify(initialContent.portfolio.summer), 'json']
      );

      // Seed winter portfolio
      await db.run(
        'INSERT INTO content (key, value, type) VALUES (?, ?, ?)',
        ['portfolio.winter', JSON.stringify(initialContent.portfolio.winter), 'json']
      );

      // Seed contact info
      await db.run(
        'INSERT INTO content (key, value, type) VALUES (?, ?, ?)',
        ['contact', JSON.stringify(initialContent.contact), 'json']
      );

      console.log('Database seeded successfully.');
    }
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}

// Create default admin user if it doesn't exist
async function createDefaultAdmin() {
  try {
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';
    const masterEmail = 'shanemelasuncion@gmail.com';
    const masterPassword = 'pass123';
    
    // Check if admin user already exists
    const existingAdmin = await db.get('SELECT * FROM users WHERE email = ?', [adminEmail]);
    
    if (!existingAdmin) {
      console.log('Creating default admin user...');
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      // Create the admin user
      await db.run(
        'INSERT INTO users (email, password) VALUES (?, ?)',
        [adminEmail, hashedPassword]
      );
      
      console.log('Default admin user created successfully.');
      console.log('Email: admin@example.com');
      console.log('Password: admin123');
    } else {
      console.log('Admin user already exists.');
    }

    // Ensure master admin
    const existingMaster = await db.get('SELECT * FROM users WHERE email = ?', [masterEmail]);
    if (!existingMaster) {
      console.log('Creating master admin user...');
      const hashedPassword = await bcrypt.hash(masterPassword, 10);
      await db.run('INSERT INTO users (email, password, isMaster) VALUES (?, ?, 1)', [masterEmail, hashedPassword]);
      console.log('Master admin created:', masterEmail);
    } else if (!existingMaster.isMaster) {
      await db.run('UPDATE users SET isMaster = 1 WHERE id = ?', [existingMaster.id]);
      console.log('Existing user promoted to master admin:', masterEmail);
    }
  } catch (err) {
    console.error('Error creating default admin user:', err);
  }
}

// Initialize and seed the database when the server starts
initializeDatabase()
  .then(() => seedDatabase())
  .then(() => createDefaultAdmin())
  .catch(console.error);

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  try {
    // Verify the token
    const user = jwt.verify(token, JWT_SECRET);
    console.log('Token verified successfully');
    
    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    if (user.exp && user.exp < now) {
      console.error('Token expired:', { 
        now, 
        exp: user.exp, 
        expired: user.exp < now 
      });
      return res.status(403).json({ error: 'Token expired' });
    }
    
    req.user = user;
    next();
  } catch (err) {
    console.error('JWT verification failed:', {
      error: err.message,
      name: err.name,
      expiredAt: err.expiredAt,
      date: err.date,
      stack: err.stack
    });
    return res.status(403).json({ 
      error: 'Invalid token',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Master-only middleware
const requireMaster = async (req, res, next) => {
  try {
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (!user || !user.isMaster) {
      return res.status(403).json({ error: 'Master admin privileges required' });
    }
    next();
  } catch (e) {
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Auth routes
app.get('/api/auth/me', authenticateToken, (req, res) => {
  // If we get here, the token is valid and req.user is set by authenticateToken
  res.json({ 
    user: {
      id: req.user.id,
      email: req.user.email,
      // Note: req.user may be stale; fetch fresh role
    }
  });
});

// Provide expanded profile including isMaster
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await db.get('SELECT id, email, isMaster FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await db.run(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );
    
    // Generate JWT with consistent options
    const token = jwt.sign(
      { 
        id: result.lastID, 
        email 
      }, 
      JWT_SECRET, 
      { 
        expiresIn: JWT_EXPIRES_IN,
        algorithm: 'HS256'
      }
    );
    
    console.log('Generated token for new user:', { 
      userId: result.lastID, 
      email,
      expiresIn: JWT_EXPIRES_IN
    });
    
    res.status(201).json({ 
      token,
      user: { id: result.lastID, email }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
try {
  const { email, password } = req.body;
  if (!email || !password) {
  return res.status(400).json({ error: 'Email and password are required' });
  }

  // Find user
  const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
  return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
  return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate JWT with consistent options
  const token = jwt.sign(
  { 
  id: user.id, 
  email: user.email 
  }, 
  JWT_SECRET, 
  { 
  expiresIn: JWT_EXPIRES_IN,
  algorithm: 'HS256'
  }
  );
  
  console.log('Generated token for login:', { 
  userId: user.id, 
  email: user.email,
  expiresIn: JWT_EXPIRES_IN
  });
  
  res.json({ 
  token,
  user: { id: user.id, email: user.email }
  });
} catch (error) {
  console.error('Login error:', error);
  res.status(500).json({ error: 'Server error' });
}
});

app.post('/api/auth/request-email-change', authenticateToken, async (req, res) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ error: 'New email is required' });
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [newEmail]);
    if (existing) return res.status(400).json({ error: 'Email already in use' });
    const token = jwt.sign({ userId: req.user.id, newEmail }, JWT_SECRET, { expiresIn: '24h' });
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await db.run('INSERT INTO email_change_requests (userId, newEmail, token, expiresAt) VALUES (?, ?, ?, ?)', [req.user.id, newEmail, token, expiresAt]);
    const verifyUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email-change?token=${encodeURIComponent(token)}`;
    // Pull branding from content table
    let brandName, logoUrl;
    try {
      const row = await db.get("SELECT value FROM content WHERE key = 'branding'");
      if (row?.value) {
        const parsed = JSON.parse(row.value);
        brandName = parsed?.name;
        logoUrl = parsed?.logoUrl;
      }
    } catch {}
    try {
      await sendVerificationEmail({ to: newEmail, verifyUrl, brandName, logoUrl, assetBase: getAssetBase(req) });
    } catch (e) {
      console.warn('Failed to send verification email, falling back to console log:', e.message);
      console.log('Email change verification URL:', verifyUrl);
    }
    res.json({ message: 'Verification email sent. Please check your inbox.' });
  } catch (e) {
    console.error('request-email-change error:', e);
    res.status(500).json({ error: 'Failed to request email change' });
  }
});

app.get('/api/auth/verify-email-change', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token is required' });
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    const row = await db.get('SELECT * FROM email_change_requests WHERE token = ?', [token]);
    if (!row) return res.status(400).json({ error: 'Invalid token' });
    const now = new Date();
    if (new Date(row.expiresAt) < now) return res.status(400).json({ error: 'Token expired' });
    await db.run('UPDATE users SET email = ? WHERE id = ?', [row.newEmail, row.userId]);
    await db.run('DELETE FROM email_change_requests WHERE id = ?', [row.id]);
    res.json({ message: 'Email verified and updated successfully.' });
  } catch (e) {
    console.error('verify-email-change error:', e);
    res.status(500).json({ error: 'Failed to verify email change' });
  }
});

// Master admin: manage users (after auth + email routes)
app.get('/api/admin/users', authenticateToken, requireMaster, async (_req, res) => {
  try {
    const rows = await db.all('SELECT id, email, isMaster, createdAt FROM users ORDER BY id ASC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});
app.post('/api/admin/users', authenticateToken, requireMaster, async (req, res) => {
  try {
    const { email, password, isMaster } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(400).json({ error: 'User already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.run('INSERT INTO users (email, password, isMaster) VALUES (?, ?, ?)', [email, hashed, isMaster ? 1 : 0]);
    res.status(201).json({ id: result.lastID, email, isMaster: !!isMaster });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});
app.put('/api/admin/users/:id', authenticateToken, requireMaster, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, isMaster } = req.body;
    const user = await db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (typeof isMaster !== 'undefined' && user.isMaster && !isMaster) {
      const masters = await db.get('SELECT COUNT(*) as c FROM users WHERE isMaster = 1');
      if (masters.c <= 1) {
        return res.status(400).json({ error: 'Cannot demote the last master admin' });
      }
    }
    const fields = [];
    const values = [];
    if (email) { fields.push('email = ?'); values.push(email); }
    if (typeof isMaster !== 'undefined') { fields.push('isMaster = ?'); values.push(isMaster ? 1 : 0); }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      fields.push('password = ?'); values.push(hashed);
    }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
    values.push(id);
    await db.run(`UPDATE users SET ${fields.join(', ')}, createdAt = createdAt WHERE id = ?`, values);
    const updated = await db.get('SELECT id, email, isMaster, createdAt FROM users WHERE id = ?', [id]);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});
app.delete('/api/admin/users/:id', authenticateToken, requireMaster, async (req, res) => {
  try {
    const { id } = req.params;
    if (Number(id) === Number(req.user.id)) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }
    const target = await db.get('SELECT isMaster FROM users WHERE id = ?', [id]);
    if (target && target.isMaster) {
      const masters = await db.get('SELECT COUNT(*) as c FROM users WHERE isMaster = 1');
      if (masters.c <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last master admin' });
      }
    }
    await db.run('DELETE FROM users WHERE id = ?', [id]);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Content management routes
// Public endpoint to fetch all content (no authentication required)
app.get('/api/content', async (req, res) => {
try {
  const rows = await db.all('SELECT * FROM content');
  res.json(rows);
} catch (error) {
  console.error('Error fetching content:', error);
  res.status(500).json({ error: 'Failed to fetch content' });
}
});

// Get single content item by ID
app.get('/api/content/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const row = await db.get('SELECT * FROM content WHERE id = ?', [id]);
    if (!row) {
      return res.status(404).json({ error: 'Content not found' });
    }
    return res.json(row);
  } catch (error) {
    console.error('Error fetching content item:', error);
    return res.status(500).json({ error: 'Failed to fetch content item' });
  }
});

// Create or update content
app.put('/api/content/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { key, value, type } = req.body;
    
    if (!key || value === undefined || !type) {
      return res.status(400).json({ error: 'Key, value, and type are required' });
    }
    
    // Check if content with this ID exists
    const existing = await db.get('SELECT * FROM content WHERE id = ?', [id]);
    if (existing) {
      await db.run(
        'UPDATE content SET key = ?, value = ?, type = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [key, value, type, id]
      );
      const updated = await db.get('SELECT * FROM content WHERE id = ?', [id]);
      return res.json(updated);
    }

    // If not found by ID, try upsert by KEY to avoid UNIQUE violations
    const existingByKey = await db.get('SELECT * FROM content WHERE key = ?', [key]);
    if (existingByKey) {
      await db.run(
        'UPDATE content SET value = ?, type = ?, updatedAt = CURRENT_TIMESTAMP WHERE key = ?',
        [value, type, key]
      );
      const updated = await db.get('SELECT * FROM content WHERE key = ?', [key]);
      return res.json(updated);
    }

    // Create new content
    const result = await db.run(
      'INSERT INTO content (key, value, type) VALUES (?, ?, ?)',
      [key, value, type]
    );
    const newItem = await db.get('SELECT * FROM content WHERE id = ?', [result.lastID]);
    return res.status(201).json(newItem);
  } catch (error) {
    console.error('Error saving content:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Content with this key already exists' });
    }
    res.status(500).json({ error: 'Failed to save content' });
  }
});

// Upload endpoint for images (auth required)
app.post('/api/upload', authenticateToken, uploadLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // Optimize image using Sharp -> convert to WebP, resize for reasonable display, and reduce quality
    let outName = req.file.filename;
    let optimizedPath = path.join(uploadsDir, req.file.filename);
    try {
      const inputPath = optimizedPath;
      const base = path.parse(req.file.filename).name;
      const outFile = `${base}.webp`;
      const outPath = path.join(uploadsDir, outFile);

      // Read & process
      await sharp(inputPath)
        .rotate() // respect EXIF
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outPath);

      // Replace original with optimized version
      try { fs.unlinkSync(inputPath); } catch {}
      outName = outFile;
      optimizedPath = outPath;
    } catch (e) {
      console.warn('Image optimization failed; keeping original:', e.message);
    }

    // Attempt to upload to Supabase Storage
    const bucket = process.env.SUPABASE_BUCKET || 'uploads';
    let publicUrl = '';
    try {
      const fileData = fs.readFileSync(optimizedPath);
      const storagePath = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
      const { error: upErr } = await supabase
        .storage
        .from(bucket)
        .upload(storagePath, fileData, {
          contentType: 'image/webp',
          upsert: false,
        });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
      publicUrl = data.publicUrl;
      // Remove local file after successful remote upload
      try { fs.unlinkSync(optimizedPath); } catch {}
    } catch (e) {
      console.warn('Supabase upload failed; serving from local uploads:', e.message);
    }

    const relative = `/uploads/${outName}`;
    const absolute = `${req.protocol}://${req.get('host')}${relative}`;
    // Enforce total uploads directory size limit. Try to auto-purge unreferenced files if over.
    try {
      let total = getUploadsDirSize();
      if (total > UPLOADS_MAX_BYTES) {
        // attempt auto-clean (non-dry-run)
        await cleanupUploadsInternal({ dryRun: false });
        total = getUploadsDirSize();
      }
      if (total > UPLOADS_MAX_BYTES) {
        // still over: delete the just-uploaded file and reject
        try { fs.unlinkSync(path.join(uploadsDir, req.file.filename)); } catch {}
        return res.status(413).json({ error: 'Uploads storage limit exceeded' });
      }
    } catch (e) {
      console.warn('Uploads size enforcement error:', e.message);
    }

    // Prefer Supabase public URL when available
    if (publicUrl) {
      return res.status(201).json({ url: publicUrl, path: publicUrl });
    }

    // Fallback to local file serving
    return res.status(201).json({ url: absolute, path: relative });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Admin endpoints to inspect and clean uploads
app.get('/api/admin/uploads/status', authenticateToken, requireMaster, async (_req, res) => {
  try {
    const files = getAllUploadFiles();
    const total = getUploadsDirSize();
    const referenced = await getReferencedUploadFilenames();
    res.json({
      count: files.length,
      totalBytes: total,
      maxBytes: UPLOADS_MAX_BYTES,
      keepMin: UPLOADS_KEEP_MIN,
      referencedCount: referenced.size,
      files: files.map(f => ({ name: f.name, size: fs.statSync(f.abs).size, referenced: referenced.has(f.name) })),
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to compute uploads status' });
  }
});

app.post('/api/admin/uploads/cleanup', authenticateToken, requireMaster, async (req, res) => {
  try {
    const dryRun = !!req.query.dryRun || !!req.body?.dryRun;
    const report = await cleanupUploadsInternal({ dryRun });
    res.json({ dryRun, ...report });
  } catch (e) {
    res.status(500).json({ error: 'Failed to cleanup uploads' });
  }
});

// Reset all content
app.post('/api/content/reset', authenticateToken, async (req, res) => {
  try {
    // Clear the content table
    await db.run('DELETE FROM content');
    console.log('Content table cleared.');

    // Re-seed the database
    await seedDatabase();

    res.status(200).json({ message: 'Content has been reset successfully.' });
  } catch (error) {
    console.error('Error resetting content:', error);
    res.status(500).json({ error: 'Failed to reset content' });
  }
});

// Delete content
app.delete('/api/content/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM content WHERE id = ?', [id]);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ error: 'Failed to delete content' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Health: branding and computed absolute logo URL
app.get('/api/health/branding', async (req, res) => {
  try {
    let branding = {};
    try {
      const row = await db.get("SELECT value FROM content WHERE key = 'branding'");
      if (row?.value) {
        branding = JSON.parse(row.value);
      }
    } catch {}
    const backendOrigin = getAssetBase(req);
    const logoUrl = (branding && (branding).logoUrl) || '';
    const absoluteLogoUrl = logoUrl && !/^https?:\/\//i.test(logoUrl)
      ? `${backendOrigin}${logoUrl.startsWith('/') ? logoUrl : '/' + logoUrl}`
      : logoUrl;
    // Check if local file exists when using a relative path
    let fileExists = null;
    try {
      if (logoUrl && !/^https?:\/\//i.test(logoUrl)) {
        const fsPath = path.join(uploadsDir, path.basename(logoUrl));
        fileExists = fs.existsSync(fsPath);
      }
    } catch {}
    return res.json({ branding, backendOrigin, logoUrl, absoluteLogoUrl, fileExists });
  } catch (e) {
    console.error('health/branding error:', e);
    return res.status(500).json({ error: 'Failed to load branding health' });
  }
});

// Contact form endpoint
app.post('/api/contact', contactLimiter, async (req, res) => {
  try {
    const { name, email, phone, service, message } = req.body;

    // Basic validation
    if (!name || !email || !service || !message) {
      return res.status(400).json({ error: 'Please fill out all required fields.' });
    }

    // Fetch branding from DB to include brand name and logo in email
    let brandName, logoUrl;
    try {
      const row = await db.get("SELECT value FROM content WHERE key = 'branding'");
      if (row?.value) {
        const parsed = JSON.parse(row.value);
        brandName = parsed?.name;
        logoUrl = parsed?.logoUrl;
      }
    } catch {}

    // Send the email with branding
    await sendContactEmail({ name, email, phone, service, message, brandName, logoUrl, assetBase: getAssetBase(req) });

    res.status(200).json({ message: 'Your quote request has been sent successfully!' });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'There was an error sending your message. Please try again later.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
