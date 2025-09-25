import supabase from './supabaseClient.js';

const USE_SUPABASE_DB = String(process.env.USE_SUPABASE_DB || '').toLowerCase() === 'true';
let sqliteDb = null;

export function setSqliteDb(db) {
  sqliteDb = db;
}

// CONTENT API
export const contentAdapter = {
  async getAll() {
    if (USE_SUPABASE_DB) {
      const { data, error } = await supabase.from('content').select('*');
      if (error) throw error;
      return data || [];
    }
    if (!sqliteDb) throw new Error('SQLite DB not initialized');
    return await sqliteDb.all('SELECT * FROM content');
  },
  async getById(id) {
    if (USE_SUPABASE_DB) {
      const { data, error } = await supabase.from('content').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    }
    return await sqliteDb.get('SELECT * FROM content WHERE id = ?', [id]);
  },
  async getByKey(key) {
    if (USE_SUPABASE_DB) {
      const { data, error } = await supabase.from('content').select('*').eq('key', key).single();
      if (error && error.code !== 'PGRST116') throw error; // not found
      return data || null;
    }
    return await sqliteDb.get('SELECT * FROM content WHERE key = ?', [key]);
  },
  async upsertByIdOrKey(id, key, value, type) {
    if (USE_SUPABASE_DB) {
      if (id) {
        const { data, error } = await supabase
          .from('content')
          .update({ key, value, type, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select('*')
          .single();
        if (error) throw error;
        return data;
      }
      // Upsert by key
      const existing = await this.getByKey(key);
      if (existing) {
        const { data, error } = await supabase
          .from('content')
          .update({ value, type, updated_at: new Date().toISOString() })
          .eq('key', key)
          .select('*')
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from('content')
        .insert({ key, value, type })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    }
    // SQLite
    if (id) {
      await sqliteDb.run(
        'UPDATE content SET key = ?, value = ?, type = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
        [key, value, type, id]
      );
      return await sqliteDb.get('SELECT * FROM content WHERE id = ?', [id]);
    }
    const existingByKey = await sqliteDb.get('SELECT * FROM content WHERE key = ?', [key]);
    if (existingByKey) {
      await sqliteDb.run(
        'UPDATE content SET value = ?, type = ?, updatedAt = CURRENT_TIMESTAMP WHERE key = ?',
        [value, type, key]
      );
      return await sqliteDb.get('SELECT * FROM content WHERE key = ?', [key]);
    }
    const result = await sqliteDb.run(
      'INSERT INTO content (key, value, type) VALUES (?, ?, ?)',
      [key, value, type]
    );
    return await sqliteDb.get('SELECT * FROM content WHERE id = ?', [result.lastID]);
  },
  async deleteById(id) {
    if (USE_SUPABASE_DB) {
      const { error } = await supabase.from('content').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    await sqliteDb.run('DELETE FROM content WHERE id = ?', [id]);
  },
  async resetWithSeed(seed) {
    if (USE_SUPABASE_DB) {
      const { error: delErr } = await supabase.from('content').delete().neq('id', 0);
      if (delErr) throw delErr;
      // Insert seed
      const rows = [
        { key: 'testimonials', value: JSON.stringify(seed.testimonials), type: 'json' },
        { key: 'hero.summer', value: JSON.stringify(seed.hero.summer), type: 'json' },
        { key: 'hero.winter', value: JSON.stringify(seed.hero.winter), type: 'json' },
        { key: 'services.summer', value: JSON.stringify(seed.services.summer), type: 'json' },
        { key: 'services.winter', value: JSON.stringify(seed.services.winter), type: 'json' },
        { key: 'portfolio.summer', value: JSON.stringify(seed.portfolio.summer), type: 'json' },
        { key: 'portfolio.winter', value: JSON.stringify(seed.portfolio.winter), type: 'json' },
        { key: 'contact', value: JSON.stringify(seed.contact), type: 'json' },
      ];
      const { error: insErr } = await supabase.from('content').insert(rows);
      if (insErr) throw insErr;
      return;
    }
    // SQLite fallback: handled in server route
  },
};

export default { setSqliteDb, contentAdapter };
