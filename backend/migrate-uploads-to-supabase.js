#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mime from 'mime-types';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadsDir = path.join(__dirname, 'uploads');
const bucket = process.env.SUPABASE_BUCKET || 'uploads';
const SUPABASE_URL = process.env.SUPABASE_URL;
// Prefer service role for migration; fallback to SUPABASE_KEY
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_KEY || '');

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes('--dry-run');
const DELETE_LOCAL = argv.includes('--delete-local');

function readAllUploadFiles() {
  if (!fs.existsSync(uploadsDir)) return [];
  return fs
    .readdirSync(uploadsDir)
    .filter((n) => !n.startsWith('.'))
    .map((name) => ({ name, abs: path.join(uploadsDir, name) }))
    .filter((f) => {
      try {
        return fs.statSync(f.abs).isFile();
      } catch {
        return false;
      }
    });
}

async function ensureDb() {
  const db = await open({ filename: path.join(__dirname, 'database.sqlite'), driver: sqlite3.Database });
  return db;
}

async function uploadFile(name, absPath) {
  const contentType = mime.lookup(name) || 'application/octet-stream';
  const storagePath = `migrated/${name}`; // keep same name under a folder
  const fileData = fs.readFileSync(absPath);
  const { error } = await supabase.storage.from(bucket).upload(storagePath, fileData, {
    contentType,
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

function replaceUrlsDeep(obj, map) {
  if (obj == null) return obj;
  if (typeof obj === 'string') {
    // Replace both relative and absolute /uploads/<file>
    let out = obj;
    for (const [filename, publicUrl] of map.entries()) {
      const rel = new RegExp(`(?:https?:\/\/[^\s"']+)?\/uploads\/${filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
      out = out.replace(rel, publicUrl);
    }
    return out;
  }
  if (Array.isArray(obj)) return obj.map((v) => replaceUrlsDeep(v, map));
  if (typeof obj === 'object') {
    const next = {};
    for (const k of Object.keys(obj)) next[k] = replaceUrlsDeep(obj[k], map);
    return next;
  }
  return obj;
}

async function main() {
  console.log(`Starting migration: uploadsDir=${uploadsDir}, bucket=${bucket}, dryRun=${DRY_RUN}, deleteLocal=${DELETE_LOCAL}`);

  // Check environment
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY) must be set in .env');
    process.exit(1);
  }

  // Collect files
  const files = readAllUploadFiles();
  if (!files.length) {
    console.log('No local files found in uploads/. Nothing to migrate.');
  }

  // Upload files and build map
  const urlMap = new Map(); // filename -> publicUrl
  for (const f of files) {
    try {
      console.log(`Uploading ${f.name} ...`);
      if (DRY_RUN) {
        urlMap.set(f.name, `https://example.com/storage/${f.name}`);
      } else {
        const publicUrl = await uploadFile(f.name, f.abs);
        urlMap.set(f.name, publicUrl);
      }
    } catch (e) {
      console.warn(`Failed to upload ${f.name}:`, e.message);
    }
  }

  // Update database content
  const db = await ensureDb();
  const rows = await db.all('SELECT id, key, value FROM content');
  let updatedCount = 0;
  for (const row of rows) {
    try {
      let changed = false;
      let value = row.value;
      // Try JSON parse
      try {
        const parsed = JSON.parse(row.value);
        const replaced = replaceUrlsDeep(parsed, urlMap);
        const newStr = JSON.stringify(replaced);
        if (newStr !== row.value) {
          changed = true;
          value = newStr;
        }
      } catch {
        // Fallback to string replace using regex
        let out = row.value;
        for (const [filename, publicUrl] of urlMap.entries()) {
          const rel = new RegExp(`(?:https?:\/\/[^\s"']+)?\/uploads\/${filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
          out = out.replace(rel, publicUrl);
        }
        if (out !== row.value) {
          changed = true;
          value = out;
        }
      }

      if (changed) {
        console.log(`Updating content id=${row.id} key=${row.key}`);
        if (!DRY_RUN) {
          await db.run('UPDATE content SET value = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [value, row.id]);
        }
        updatedCount++;
      }
    } catch (e) {
      console.warn(`Failed to process content id=${row.id}:`, e.message);
    }
  }

  // Optionally delete local files
  if (DELETE_LOCAL && !DRY_RUN) {
    for (const f of files) {
      try {
        fs.unlinkSync(f.abs);
        console.log(`Deleted local ${f.name}`);
      } catch (e) {
        console.warn(`Failed to delete ${f.name}:`, e.message);
      }
    }
  }

  console.log(`Migration complete. files=${files.length}, updatedContentRows=${updatedCount}, dryRun=${DRY_RUN}, deleteLocal=${DELETE_LOCAL}`);
  await db?.close();
}

main().catch((e) => {
  console.error('Migration error:', e);
  process.exit(1);
});
