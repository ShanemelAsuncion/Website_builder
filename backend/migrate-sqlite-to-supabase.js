#!/usr/bin/env node
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_KEY');
    process.exit(1);
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const db = await open({ filename: path.join(__dirname, 'database.sqlite'), driver: sqlite3.Database });

  // Users
  const users = await db.all('SELECT id, email, password, isMaster, createdAt FROM users');
  for (const u of users) {
    try {
      const { error } = await supabase.from('users').upsert({
        id: u.id,
        email: u.email,
        password: u.password,
        is_master: !!u.isMaster,
        created_at: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
      }, { onConflict: 'id' });
      if (error) throw error;
      console.log('Upserted user', u.email);
    } catch (e) {
      console.warn('Failed to upsert user', u.email, e.message);
    }
  }

  // Content
  const content = await db.all('SELECT id, key, value, type, updatedAt FROM content');
  for (const c of content) {
    try {
      const { error } = await supabase.from('content').upsert({
        id: c.id,
        key: c.key,
        value: c.value,
        type: c.type,
        updated_at: c.updatedAt ? new Date(c.updatedAt).toISOString() : new Date().toISOString(),
      }, { onConflict: 'id' });
      if (error) throw error;
      console.log('Upserted content', c.key);
    } catch (e) {
      console.warn('Failed to upsert content', c.key, e.message);
    }
  }

  // Password reset tokens
  try {
    const tokens = await db.all('SELECT id, userId, token, expiresAt, createdAt FROM password_reset_tokens');
    for (const t of tokens) {
      try {
        const { error } = await supabase.from('password_reset_tokens').upsert({
          id: t.id,
          user_id: t.userId,
          token: t.token,
          expires_at: new Date(t.expiresAt).toISOString(),
          created_at: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
        }, { onConflict: 'id' });
        if (error) throw error;
        console.log('Upserted token', t.id);
      } catch (e) {
        console.warn('Failed to upsert token', t.id, e.message);
      }
    }
  } catch {}

  // Email change requests
  try {
    const changes = await db.all('SELECT id, userId, newEmail, token, expiresAt, createdAt FROM email_change_requests');
    for (const r of changes) {
      try {
        const { error } = await supabase.from('email_change_requests').upsert({
          id: r.id,
          user_id: r.userId,
          new_email: r.newEmail,
          token: r.token,
          expires_at: new Date(r.expiresAt).toISOString(),
          created_at: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        }, { onConflict: 'id' });
        if (error) throw error;
        console.log('Upserted email change request', r.id);
      } catch (e) {
        console.warn('Failed to upsert email change request', r.id, e.message);
      }
    }
  } catch {}

  await db.close();
  console.log('Migration complete');
}

main().catch((e) => { console.error(e); process.exit(1); });
