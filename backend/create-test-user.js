import bcrypt from 'bcryptjs';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

async function createTestUser() {
  try {
    const db = await open({
      filename: './database.sqlite',
      driver: sqlite3.Database
    });

    const email = 'admin@example.com';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if user already exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    
    if (existingUser) {
      console.log('User already exists. Updating password...');
      await db.run(
        'UPDATE users SET password = ? WHERE email = ?',
        [hashedPassword, email]
      );
      console.log('Password updated successfully!');
    } else {
      await db.run(
        'INSERT INTO users (email, password) VALUES (?, ?)',
        [email, hashedPassword]
      );
      console.log('Test user created successfully!');
    }
    
    console.log('Test user credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    
    await db.close();
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

createTestUser();
