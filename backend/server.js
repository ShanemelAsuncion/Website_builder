import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import bodyParser from 'body-parser';
import { initialContent } from './seedData.js';
import { sendContactEmail } from './email.js';

// Configure dotenv
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Database } = sqlite3.verbose();

const app = express();
const PORT = process.env.PORT || 5000;

// Use a consistent JWT secret for development
// This secret is used for both signing and verifying tokens
const JWT_SECRET = 'your-super-secret-key-1234567890';
const JWT_EXPIRES_IN = '1h';

console.log('Server starting with JWT configuration:', {
  JWT_SECRET: JWT_SECRET ? '*** (set)' : 'NOT SET!',
  JWT_EXPIRES_IN
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(bodyParser.json());

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
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
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

      console.log('Database seeded successfully.');
    }
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}

// Initialize and seed the database when the server starts
initializeDatabase()
  .then(() => seedDatabase())
  .catch(console.error);

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  console.log('Verifying token:', token);
  try {
    console.log('Verifying token with secret:', JWT_SECRET);
    console.log('Token to verify:', token);
    
    // Verify the token
    const user = jwt.verify(token, JWT_SECRET);
    console.log('Token verified successfully for user:', user);
    
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

// Auth routes
app.get('/api/auth/me', authenticateToken, (req, res) => {
  // If we get here, the token is valid and req.user is set by authenticateToken
  res.json({ 
    user: {
      id: req.user.id,
      email: req.user.email
    }
  });
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

    // Get user from DB
    const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password in DB
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

// Content management routes
app.get('/api/content', authenticateToken, async (req, res) => {
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
    
    res.json(row);
  } catch (error) {
    console.error('Error fetching content item:', error);
    res.status(500).json({ error: 'Failed to fetch content item' });
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
      // Update existing content
      const result = await db.run(
        'UPDATE content SET key = ?, value = ?, type = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [key, value, type, id]
      );
      const updated = await db.get('SELECT * FROM content WHERE id = ?', [id]);
      res.json(updated);
    } else {
      // Create new content
      const result = await db.run(
        'INSERT INTO content (key, value, type) VALUES (?, ?, ?)',
        [key, value, type]
      );
      const newItem = await db.get('SELECT * FROM content WHERE id = ?', [result.lastID]);
      res.status(201).json(newItem);
    }
  } catch (error) {
    console.error('Error saving content:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Content with this key already exists' });
    }
    res.status(500).json({ error: 'Failed to save content' });
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

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, service, message } = req.body;

    // Basic validation
    if (!name || !email || !service || !message) {
      return res.status(400).json({ error: 'Please fill out all required fields.' });
    }

    // Send the email
    await sendContactEmail({ name, email, phone, service, message });

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
