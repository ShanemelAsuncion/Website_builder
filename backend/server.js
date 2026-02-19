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
import dbAdapter, { contentAdapter, setSqliteDb } from './dbAdapter.js';
import usersDb, { usersAdapter, setUsersSqliteDb } from './usersAdapter.js';
import settingsDb, { settingsAdapter, setSettingsSqliteDb } from './settingsAdapter.js';

// Configure dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Database } = sqlite3.verbose();

const app = express();
// Behind a reverse proxy (Render), trust only the first proxy hop.
// This satisfies express-rate-limit validation and still honors X-Forwarded-* headers.
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// --- ADDED: ROOT ROUTE & HEALTH CHECK ---
// This fixes the "Cannot GET /" error on Render
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: "Jay's Blade and Snow Services API",
    database: process.env.USE_SUPABASE_DB === 'true' ? 'Supabase' : 'Local SQLite',
    timestamp: new Date().toISOString()
  });
});

// Use a consistent JWT secret for development
// This secret is used for both signing and verifying tokens
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-1234567890';
// Allow configuring expiry via env (e.g., '12h', '2h', '1d')
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

console.log('Server starting with JWT configuration:', {
  JWT_SECRET: JWT_SECRET ? '*** (set)' : 'NOT SET!',
  JWT_EXPIRES_IN
});

// (settings routes moved below, after auth middleware definitions)

// Runtime config cache (in-memory, short-lived)
let __runtimeConfigCache = { data: null, ts: 0 };
const RUNTIME_CONFIG_TTL_MS = Number(process.env.RUNTIME_CONFIG_TTL_MS || 15000); // 15s

async function fetchRuntimeConfig(backendOrigin) {
  // 1) Try settings table (Supabase)
  try {
    if (process.env.USE_SUPABASE_DB && process.env.SUPABASE_URL) {
      const { data, error } = await supabase.from('settings').select('*');
      if (!error && Array.isArray(data) && data.length) {
        const map = new Map();
        for (const row of data) {
          try {
            const val = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
            map.set(row.key, val);
          } catch {
            map.set(row.key, row.value);
          }
        }
        const siteName = map.get('SITE_NAME') || map.get('site_name') || process.env.BRAND_NAME || "Jay's Blade and Snow Services";
        const userEmail = map.get('USER_EMAIL') || map.get('user_email') || process.env.CONTACT_RECIPIENT || process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || '';
        return { API_BASE_URL: `${backendOrigin}/api`, BACKEND_ORIGIN: backendOrigin, USER_EMAIL: userEmail, SITE_NAME: siteName };
      }
    }
  } catch (e) {
    console.warn('settings fetch failed:', e.message);
  }

  // 2) Try Supabase Storage JSON
  try {
    const bucket = process.env.SUPABASE_CONFIG_BUCKET;
    const key = process.env.SUPABASE_CONFIG_KEY; // e.g., 'config/runtime.json'
    if (bucket && key) {
      const { data, error } = await supabase.storage.from(bucket).download(key);
      if (!error && data) {
        const text = await data.text();
        const cfg = JSON.parse(text);
        // Only expose non-sensitive keys
        const siteName = cfg.SITE_NAME || cfg.site_name || process.env.BRAND_NAME || "Jay's Blade and Snow Services";
        const userEmail = cfg.USER_EMAIL || cfg.user_email || process.env.CONTACT_RECIPIENT || process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || '';
        return { API_BASE_URL: `${backendOrigin}/api`, BACKEND_ORIGIN: backendOrigin, USER_EMAIL: userEmail, SITE_NAME: siteName };
      }
    }
  } catch (e) {
    console.warn('storage config fetch failed:', e.message);
  }

  // 3) Fallback to content keys (branding/contact)
  let siteName = process.env.BRAND_NAME || "Jay's Blade and Snow Services";
  let userEmail = process.env.CONTACT_RECIPIENT || process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || '';
  try {
    const brandingRow = await contentAdapter.getByKey('branding');
    if (brandingRow?.value) {
      const branding = JSON.parse(brandingRow.value);
      if (branding?.name) siteName = branding.name;
    }
  } catch {}
  try {
    const contactRow = await contentAdapter.getByKey('contact');
    if (contactRow?.value) {
      const contact = JSON.parse(contactRow.value);
      if (contact?.email) userEmail = contact.email;
    }
  } catch {}
  return { API_BASE_URL: `${backendOrigin}/api`, BACKEND_ORIGIN: backendOrigin, USER_EMAIL: userEmail, SITE_NAME: siteName };
}

// Public runtime configuration for frontend (after middleware so CORS applies)
app.get('/api/config', async (req, res) => {
  try {
    const backendOrigin = getAssetBase(req);
    // Short TTL cache to reduce DB/Storage pressure
    const now = Date.now();
    if (__runtimeConfigCache.data && now - __runtimeConfigCache.ts < RUNTIME_CONFIG_TTL_MS) {
      res.set('Cache-Control', 'no-store, max-age=0');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      return res.json(__runtimeConfigCache.data);
    }
    const cfg = await fetchRuntimeConfig(backendOrigin);
    __runtimeConfigCache = { data: cfg, ts: now };
    res.set('Cache-Control', 'no-store, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    return res.json(cfg);
  } catch (e) {
    console.error('config endpoint error:', e);
    return res.status(500).json({ error: 'Failed to load config' });
  }
});

// (moved /api/config endpoint below, after middleware)

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

// Global basic rate limiter (raised limits to reduce 429s while keeping protection)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 1000, // allow more requests per IP per 15 mins
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
// CORS allowlist: configurable via FRONTEND_ORIGINS (comma-separated), with sensible local defaults
const DEFAULT_ORIGINS = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://localhost:8888'];
const FRONTEND_ORIGINS = (process.env.FRONTEND_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const corsOptions = {
  origin: FRONTEND_ORIGINS.length ? FRONTEND_ORIGINS : DEFAULT_ORIGINS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
// Apply CORS BEFORE any rate limiting so preflight and responses include headers
app.use(cors(corsOptions));
// Short-circuit all OPTIONS preflight requests (headers already set by cors middleware)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Now attach global basic rate limiter
app.use(globalLimiter);

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
    const user = await usersAdapter.findByEmail(email);
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
    try { await usersAdapter.clearTokensForUser(user.id); } catch {}
    await usersAdapter.insertResetToken(user.id, token, expiresAt);

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
    const row = await usersAdapter.getResetToken(token);
    if (!row) return res.status(400).json({ error: 'Invalid or used token' });
    if (new Date(row.expiresAt) < new Date()) return res.status(400).json({ error: 'Token expired' });

    // Update user password
    const hashed = await bcrypt.hash(newPassword, 10);
    await usersAdapter.updatePassword(row.userId, hashed);

    // Invalidate token
    await usersAdapter.deleteResetTokenById(row.id);
    
    return res.json({ message: 'Password has been reset successfully.' });
  } catch (e) {
    console.error('reset-password error:', e);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Configure multer in-memory storage for uploads (no local filesystem persistence)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// Remove local uploads helpers; persistence is handled entirely by Supabase Storage

// Per-route strict limiters
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 60, // allow up to 60 submissions/hour per IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 60, // allow up to 60 uploads/hour per IP
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
    // Register with adapters so routes can fall back to SQLite when not using Supabase
    try { setSqliteDb(db); } catch {}
    try { setUsersSqliteDb(db); } catch {}
    try { setSettingsSqliteDb(db); } catch {}
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

// Create default admin users only when explicitly allowed via env, never with hardcoded credentials
async function createDefaultAdmin() {
  try {
    const allow = String(process.env.ALLOW_DEFAULT_ADMIN || '').toLowerCase() === 'true';
    if (!allow) {
      return; // do nothing unless enabled
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const masterEmail = process.env.MASTER_EMAIL;
    const masterPassword = process.env.MASTER_PASSWORD;

    if (!adminEmail || !adminPassword || !masterEmail || !masterPassword) {
      console.warn('ALLOW_DEFAULT_ADMIN is true but admin/master credentials are not fully set in env; skipping default admin creation.');
      return;
    }

    // Create normal admin if missing
    const existingAdmin = await db.get('SELECT * FROM users WHERE email = ?', [adminEmail]);
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await db.run('INSERT INTO users (email, password) VALUES (?, ?)', [adminEmail, hashedPassword]);
      console.log('Default admin user ensured.');
    }

    // Ensure master admin exists and is flagged
    const existingMaster = await db.get('SELECT * FROM users WHERE email = ?', [masterEmail]);
    if (!existingMaster) {
      const hashedPassword = await bcrypt.hash(masterPassword, 12);
      await db.run('INSERT INTO users (email, password, isMaster) VALUES (?, ?, 1)', [masterEmail, hashedPassword]);
      console.log('Master admin ensured.');
    } else if (!existingMaster.isMaster) {
      await db.run('UPDATE users SET isMaster = 1 WHERE id = ?', [existingMaster.id]);
      console.log('Existing user promoted to master admin.');
    }
  } catch (err) {
    console.error('Error ensuring default admin users:', err);
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
    const user = await usersAdapter.getById(req.user.id);
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
    const existingUser = await usersAdapter.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const userId = await usersAdapter.createUser(email, hashedPassword, false);
    
    // Generate JWT with consistent options
    const token = jwt.sign(
      { 
        id: userId, 
        email 
      }, 
      JWT_SECRET, 
      { 
        expiresIn: JWT_EXPIRES_IN,
        algorithm: 'HS256'
      }
    );
    
    console.log('Generated token for new user:', { 
      userId, 
      email,
      expiresIn: JWT_EXPIRES_IN
    });
    
    res.status(201).json({ 
      token,
      user: { id: userId, email }
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

    const user = await usersAdapter.getById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await usersAdapter.updatePassword(userId, hashedNewPassword);
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
  const user = await usersAdapter.findByEmail(email);
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
    const existing = await usersAdapter.findByEmail(newEmail);
    if (existing) return res.status(400).json({ error: 'Email already in use' });
    const token = jwt.sign({ userId: req.user.id, newEmail }, JWT_SECRET, { expiresIn: '24h' });
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await usersAdapter.insertEmailChange(req.user.id, newEmail, token, expiresAt);
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
    const row = await usersAdapter.getEmailChangeByToken(token);
    if (!row) return res.status(400).json({ error: 'Invalid token' });
    const now = new Date();
    if (new Date(row.expiresAt) < now) return res.status(400).json({ error: 'Token expired' });
    await usersAdapter.updateUserEmail(row.userId, row.newEmail);
    await usersAdapter.deleteEmailChangeById(row.id);
    res.json({ message: 'Email verified and updated successfully.' });
  } catch (e) {
    console.error('verify-email-change error:', e);
    res.status(500).json({ error: 'Failed to verify email change' });
  }
});

// Master admin: manage users (after auth + email routes)
app.get('/api/admin/users', authenticateToken, requireMaster, async (_req, res) => {
  try {
    const rows = await usersAdapter.listUsers();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});
app.post('/api/admin/users', authenticateToken, requireMaster, async (req, res) => {
  try {
    const { email, password, isMaster } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    const existing = await usersAdapter.findByEmail(email);
    if (existing) return res.status(400).json({ error: 'User already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const created = await usersAdapter.createUserAdmin(email, hashed, !!isMaster);
    res.status(201).json(created);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});
app.put('/api/admin/users/:id', authenticateToken, requireMaster, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, isMaster } = req.body;
    const user = await usersAdapter.getById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (typeof isMaster !== 'undefined' && user.isMaster && !isMaster) {
      const masters = await usersAdapter.countMasters();
      if (masters.c <= 1) {
        return res.status(400).json({ error: 'Cannot demote the last master admin' });
      }
    }
    const payload = { email, isMaster };
    if (password) {
      payload.passwordHash = await bcrypt.hash(password, 10);
    }
    const updated = await usersAdapter.updateUserAdmin(id, payload);
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
    const target = await usersAdapter.getById(id);
    if (target && target.isMaster) {
      const masters = await usersAdapter.countMasters();
      if (masters.c <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last master admin' });
      }
    }
    await usersAdapter.deleteUser(id);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Content management routes
// Public endpoint to fetch all content (no authentication required)
app.get('/api/content', async (_req, res) => {
  try {
    const rows = await contentAdapter.getAll();
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
    const row = await contentAdapter.getById(id);
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
    const updated = await contentAdapter.upsertByIdOrKey(id, key, value, type);
    return res.json(updated);
  } catch (error) {
    console.error('Error saving content:', error);
    if (error.message && error.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Content with this key already exists' });
    }
    res.status(500).json({ error: 'Failed to save content' });
  }
});

// ...
// Upload endpoint for images (auth required)
app.post('/api/upload', authenticateToken, uploadLimiter, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // Mimetype whitelist to images only
    const allowed = ['image/jpeg','image/png','image/webp','image/gif'];
    if (!allowed.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Unsupported file type' });
    }
    // Optimize and convert to WebP directly from buffer
    let outputBuffer = req.file.buffer;
    let contentType = req.file.mimetype || 'application/octet-stream';
    try {
      outputBuffer = await sharp(req.file.buffer)
        .rotate()
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      contentType = 'image/webp';
    } catch (e) {
      console.warn('Image optimization failed; uploading original buffer:', e.message);
    }

    // Upload to Supabase Storage
    const bucket = process.env.SUPABASE_BUCKET || 'uploads';
    const storagePath = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${contentType === 'image/webp' ? 'webp' : (path.extname(req.file.originalname).slice(1) || 'bin')}`;
    const { error: upErr } = await supabase
      .storage
      .from(bucket)
      .upload(storagePath, outputBuffer, {
        contentType,
        upsert: false,
      });
    if (upErr) {
      console.error('Supabase upload error:', upErr);
      return res.status(500).json({ error: 'Failed to upload file' });
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    const publicUrl = data.publicUrl;
    return res.status(201).json({ url: publicUrl, path: publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Admin endpoints to inspect and clean uploads
// Uploads admin endpoints removed: storage is managed by Supabase

// Reset all content
app.post('/api/content/reset', authenticateToken, async (req, res) => {
  try {
    // Try adapter reset (Supabase); fallback to SQLite seed
    try {
      await contentAdapter.resetWithSeed(initialContent);
      return res.status(200).json({ message: 'Content has been reset successfully.' });
    } catch (e) {
      // Fallback to SQLite legacy
      await db.run('DELETE FROM content');
      await seedDatabase();
      return res.status(200).json({ message: 'Content has been reset successfully.' });
    }
  } catch (error) {
    console.error('Error resetting content:', error);
    res.status(500).json({ error: 'Failed to reset content' });
  }
});

// Delete content
app.delete('/api/content/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await contentAdapter.deleteById(id);
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

// Settings routes (master only). Store site-wide public runtime values.
// These return/store only non-sensitive keys, e.g., SITE_NAME, USER_EMAIL
app.get('/api/settings', authenticateToken, requireMaster, async (_req, res) => {
  try {
    const rows = await settingsAdapter.getAll();
    res.json(rows);
  } catch (e) {
    console.error('settings getAll error:', e);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

app.put('/api/settings', authenticateToken, requireMaster, async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });
    const results = [];
    for (const it of items) {
      if (!it || typeof it.key !== 'string' || typeof it.value === 'undefined') continue;
      const valueJson = typeof it.value === 'string' ? it.value : JSON.stringify(it.value);
      const saved = await settingsAdapter.upsert(it.key, valueJson);
      results.push(saved);
    }
    res.json({ updated: results.length, items: results });
  } catch (e) {
    console.error('settings upsert error:', e);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Health: branding and computed absolute logo URL
app.get('/api/health/branding', async (req, res) => {
  try {
    let branding = {};
    try {
      const row = await contentAdapter.getByKey('branding');
      if (row?.value) {
        branding = JSON.parse(row.value);
      }
    } catch {}
    const backendOrigin = getAssetBase(req);
    const logoUrl = (branding && (branding).logoUrl) || '';
    const absoluteLogoUrl = logoUrl && !/^https?:\/\//i.test(logoUrl)
      ? `${backendOrigin}${logoUrl.startsWith('/') ? logoUrl : '/' + logoUrl}`
      : logoUrl;
    return res.json({ branding, backendOrigin, logoUrl, absoluteLogoUrl });
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

    // Attempt to send the email with branding, but do not block the user if SMTP fails
    try {
      await sendContactEmail({ name, email, phone, service, message, brandName, logoUrl, assetBase: getAssetBase(req) });
      return res.status(200).json({ message: 'Your quote request has been sent successfully!' });
    } catch (e) {
      console.warn('Contact email failed, returning success to user to avoid blocking:', e?.message || e);
      // Still return success so the user isn't blocked while SMTP is being configured
      return res.status(200).json({ message: 'Your quote request was received. We will reach out shortly.' });
    }

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ error: 'There was an error sending your message. Please try again later.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
