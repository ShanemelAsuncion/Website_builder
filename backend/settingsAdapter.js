import supabase from './supabaseClient.js';

const USE_SUPABASE_DB = String(process.env.USE_SUPABASE_DB || '').toLowerCase() === 'true';
let sqliteDb = null;

export function setSettingsSqliteDb(db) {
  sqliteDb = db;
}

// Settings adapter: prefers Supabase `settings` table; SQLite fallback uses content keys
export const settingsAdapter = {
  async getAll() {
    if (USE_SUPABASE_DB) {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      return (data || []).map(r => ({ key: r.key, value: typeof r.value === 'string' ? r.value : JSON.stringify(r.value) }));
    }
    // Fallback: derive from content keys
    if (!sqliteDb) throw new Error('SQLite DB not initialized');
    const out = [];
    try {
      const b = await sqliteDb.get("SELECT value FROM content WHERE key = 'branding'");
      if (b?.value) {
        try { const j = JSON.parse(b.value); if (j?.name) out.push({ key: 'SITE_NAME', value: JSON.stringify(j.name) }); } catch {}
      }
    } catch {}
    try {
      const c = await sqliteDb.get("SELECT value FROM content WHERE key = 'contact'");
      if (c?.value) {
        try { const j = JSON.parse(c.value); if (j?.email) out.push({ key: 'USER_EMAIL', value: JSON.stringify(j.email) }); } catch {}
      }
    } catch {}
    return out;
  },
  async upsert(key, valueJson) {
    if (USE_SUPABASE_DB) {
      const parsed = (() => { try { return JSON.parse(valueJson); } catch { return valueJson; } })();
      const { error } = await supabase.from('settings')
        .upsert({ key, value: parsed }, { onConflict: 'key' });
      if (error) throw error;
      return { key, value: typeof parsed === 'string' ? parsed : JSON.stringify(parsed) };
    }
    // SQLite fallback: update content keys
    if (!sqliteDb) throw new Error('SQLite DB not initialized');
    if (key === 'SITE_NAME') {
      const row = await sqliteDb.get("SELECT value FROM content WHERE key = 'branding'");
      const branding = row?.value ? (() => { try { return JSON.parse(row.value); } catch { return {}; } })() : {};
      branding.name = (() => { try { return JSON.parse(valueJson); } catch { return valueJson; } })();
      const json = JSON.stringify(branding);
      const exists = await sqliteDb.get("SELECT id FROM content WHERE key = 'branding'");
      if (exists) await sqliteDb.run("UPDATE content SET value = ?, type='json', updatedAt=CURRENT_TIMESTAMP WHERE key = 'branding'", [json]);
      else await sqliteDb.run("INSERT INTO content (key, value, type) VALUES ('branding', ?, 'json')", [json]);
      return { key, value: JSON.stringify(branding.name) };
    }
    if (key === 'USER_EMAIL') {
      const row = await sqliteDb.get("SELECT value FROM content WHERE key = 'contact'");
      const contact = row?.value ? (() => { try { return JSON.parse(row.value); } catch { return {}; } })() : {};
      contact.email = (() => { try { return JSON.parse(valueJson); } catch { return valueJson; } })();
      const json = JSON.stringify(contact);
      const exists = await sqliteDb.get("SELECT id FROM content WHERE key = 'contact'");
      if (exists) await sqliteDb.run("UPDATE content SET value = ?, type='json', updatedAt=CURRENT_TIMESTAMP WHERE key = 'contact'", [json]);
      else await sqliteDb.run("INSERT INTO content (key, value, type) VALUES ('contact', ?, 'json')", [json]);
      return { key, value: JSON.stringify(contact.email) };
    }
    throw new Error('Unsupported key for SQLite fallback');
  }
};

export default { settingsAdapter, setSettingsSqliteDb };
