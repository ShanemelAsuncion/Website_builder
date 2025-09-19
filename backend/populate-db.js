import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';

async function populateDatabase() {
  try {
    // Open the database
    const db = await open({
      filename: './database.sqlite',
      driver: sqlite3.Database
    });

    // Clear existing data
    await db.run('DELETE FROM content');
    await db.run('DELETE FROM users');

    // Create a test admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.run(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      ['admin@example.com', hashedPassword]
    );

    // Sample content data
    const sampleContent = [
      {
        key: 'hero.title',
        value: 'Welcome to Blade & Snow Services',
        type: 'text'
      },
      {
        key: 'hero.subtitle',
        value: 'Professional landscaping and snow removal services',
        type: 'text'
      },
      {
        key: 'contact.phone',
        value: '(555) 123-4567',
        type: 'text'
      },
      {
        key: 'contact.email',
        value: 'info@bladesnowpro.com',
        type: 'text'
      },
      {
        key: 'contact.address',
        value: '123 Service Drive, Your City, ST 12345',
        type: 'text'
      }
    ];

    // Insert sample content
    for (const item of sampleContent) {
      await db.run(
        'INSERT INTO content (key, value, type) VALUES (?, ?, ?)',
        [item.key, item.value, item.type]
      );
    }

    console.log('✅ Database populated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating database:', error);
    process.exit(1);
  }
}

populateDatabase();
