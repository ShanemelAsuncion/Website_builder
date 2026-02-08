import supabase from './supabaseClient.js';

const USE_SUPABASE_DB = String(process.env.USE_SUPABASE_DB || '').toLowerCase() === 'true';
let sqliteDb = null;

export function setUsersSqliteDb(db) {
  sqliteDb = db;
}

export const usersAdapter = {
  // Users
  async findByEmail(email) {
    if (USE_SUPABASE_DB) {
      const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
      if (error && error.code !== 'PGRST116') return null;
      return data || null;
    }
    return await sqliteDb.get('SELECT * FROM users WHERE email = ?', [email]);
  },
  async getById(id) {
    if (USE_SUPABASE_DB) {
      const { data, error } = await supabase.from('users').select('id,email,is_master,created_at,password').eq('id', id).single();
      if (error) return null;
      // normalize
      return data ? { id: data.id, email: data.email, isMaster: data.is_master ? 1 : 0, password: data.password } : null;
    }
    const row = await sqliteDb.get('SELECT * FROM users WHERE id = ?', [id]);
    return row || null;
  },
  async createUser(email, passwordHash, isMaster = false) {
    if (USE_SUPABASE_DB) {
      const { data, error } = await supabase.from('users').insert({ email, password: passwordHash, is_master: !!isMaster }).select('id').single();
      if (error) throw error;
      return data.id;
    }
    const result = await sqliteDb.run('INSERT INTO users (email, password, isMaster) VALUES (?, ?, ?)', [email, passwordHash, isMaster ? 1 : 0]);
    return result.lastID;
  },
  async updatePassword(id, passwordHash) {
    if (USE_SUPABASE_DB) {
      const { error } = await supabase.from('users').update({ password: passwordHash }).eq('id', id);
      if (error) throw error;
      return;
    }
    await sqliteDb.run('UPDATE users SET password = ? WHERE id = ?', [passwordHash, id]);
  },
  async listUsers() {
    if (USE_SUPABASE_DB) {
      const { data, error } = await supabase.from('users').select('id,email,is_master,created_at').order('id', { ascending: true });
      if (error) throw error;
      return (data || []).map(u => ({ id: u.id, email: u.email, isMaster: u.is_master ? 1 : 0, createdAt: u.created_at }));
    }
    return await sqliteDb.all('SELECT id, email, isMaster, createdAt FROM users ORDER BY id ASC');
  },
  async createUserAdmin(email, passwordHash, isMaster) {
    if (USE_SUPABASE_DB) {
      const { data, error } = await supabase.from('users').insert({ email, password: passwordHash, is_master: !!isMaster }).select('id,email,is_master,created_at').single();
      if (error) throw error;
      return { id: data.id, email: data.email, isMaster: !!data.is_master };
    }
    const result = await sqliteDb.run('INSERT INTO users (email, password, isMaster) VALUES (?, ?, ?)', [email, passwordHash, isMaster ? 1 : 0]);
    return { id: result.lastID, email, isMaster: !!isMaster };
  },
  async updateUserAdmin(id, fields) {
    if (USE_SUPABASE_DB) {
      const payload = {};
      if (fields.email !== undefined) payload.email = fields.email;
      if (fields.passwordHash !== undefined) payload.password = fields.passwordHash;
      if (fields.isMaster !== undefined) payload.is_master = !!fields.isMaster;
      const { error } = await supabase.from('users').update(payload).eq('id', id);
      if (error) throw error;
      const { data, error: err2 } = await supabase.from('users').select('id,email,is_master,created_at').eq('id', id).single();
      if (err2) throw err2;
      return { id: data.id, email: data.email, isMaster: data.is_master ? 1 : 0, createdAt: data.created_at };
    }
    const updates = [];
    const values = [];
    if (fields.email !== undefined) { updates.push('email = ?'); values.push(fields.email); }
    if (fields.isMaster !== undefined) { updates.push('isMaster = ?'); values.push(fields.isMaster ? 1 : 0); }
    if (fields.passwordHash !== undefined) { updates.push('password = ?'); values.push(fields.passwordHash); }
    if (updates.length === 0) return await sqliteDb.get('SELECT id,email,isMaster,createdAt FROM users WHERE id = ?', [id]);
    values.push(id);
    await sqliteDb.run(`UPDATE users SET ${updates.join(', ')}, createdAt = createdAt WHERE id = ?`, values);
    return await sqliteDb.get('SELECT id,email,isMaster,createdAt FROM users WHERE id = ?', [id]);
  },
  async deleteUser(id) {
    if (USE_SUPABASE_DB) {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    await sqliteDb.run('DELETE FROM users WHERE id = ?', [id]);
  },
  async countMasters() {
    if (USE_SUPABASE_DB) {
      const { data, error } = await supabase.rpc('count_masters');
      if (!error && data != null) return { c: Number(data) };
      // Fallback query if function not present
      const { data: d2, error: e2 } = await supabase.from('users').select('is_master', { count: 'exact', head: true }).eq('is_master', true);
      if (e2) throw e2;
      return { c: d2?.length ?? 0 };
    }
    return await sqliteDb.get('SELECT COUNT(*) as c FROM users WHERE isMaster = 1');
  },
  async setMasterFlag(id, isMaster) {
    if (USE_SUPABASE_DB) {
      const { error } = await supabase.from('users').update({ is_master: !!isMaster }).eq('id', id);
      if (error) throw error;
      return;
    }
    await sqliteDb.run('UPDATE users SET isMaster = ? WHERE id = ?', [isMaster ? 1 : 0, id]);
  },

  // Password reset tokens
  async clearTokensForUser(userId) {
    if (USE_SUPABASE_DB) {
      const { error } = await supabase.from('password_reset_tokens').delete().eq('user_id', userId);
      if (error) throw error;
      return;
    }
    await sqliteDb.run('DELETE FROM password_reset_tokens WHERE userId = ?', [userId]);
  },
  async insertResetToken(userId, token, expiresAtISO) {
    if (USE_SUPABASE_DB) {
      const { error } = await supabase.from('password_reset_tokens').insert({ user_id: userId, token, expires_at: expiresAtISO });
      if (error) throw error;
      return;
    }
    await sqliteDb.run('INSERT INTO password_reset_tokens (userId, token, expiresAt) VALUES (?, ?, ?)', [userId, token, expiresAtISO]);
  },
  async getResetToken(token) {
    if (USE_SUPABASE_DB) {
      const { data, error } = await supabase.from('password_reset_tokens').select('*').eq('token', token).single();
      if (error) return null;
      return data ? { id: data.id, userId: data.user_id, token: data.token, expiresAt: data.expires_at } : null;
    }
    return await sqliteDb.get('SELECT * FROM password_reset_tokens WHERE token = ?', [token]);
  },
  async deleteResetTokenById(id) {
    if (USE_SUPABASE_DB) {
      const { error } = await supabase.from('password_reset_tokens').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    await sqliteDb.run('DELETE FROM password_reset_tokens WHERE id = ?', [id]);
  },

  // Email change requests
  async insertEmailChange(userId, newEmail, token, expiresAtISO) {
    if (USE_SUPABASE_DB) {
      const { error } = await supabase.from('email_change_requests').insert({ user_id: userId, new_email: newEmail, token, expires_at: expiresAtISO });
      if (error) throw error;
      return;
    }
    await sqliteDb.run('INSERT INTO email_change_requests (userId, newEmail, token, expiresAt) VALUES (?, ?, ?, ?)', [userId, newEmail, token, expiresAtISO]);
  },
  async getEmailChangeByToken(token) {
    if (USE_SUPABASE_DB) {
      const { data, error } = await supabase.from('email_change_requests').select('*').eq('token', token).single();
      if (error) return null;
      return data ? { id: data.id, userId: data.user_id, newEmail: data.new_email, token: data.token, expiresAt: data.expires_at } : null;
    }
    return await sqliteDb.get('SELECT * FROM email_change_requests WHERE token = ?', [token]);
  },
  async deleteEmailChangeById(id) {
    if (USE_SUPABASE_DB) {
      const { error } = await supabase.from('email_change_requests').delete().eq('id', id);
      if (error) throw error;
      return;
    }
    await sqliteDb.run('DELETE FROM email_change_requests WHERE id = ?', [id]);
  },
  async updateUserEmail(id, email) {
    if (USE_SUPABASE_DB) {
      const { error } = await supabase.from('users').update({ email }).eq('id', id);
      if (error) throw error;
      return;
    }
    await sqliteDb.run('UPDATE users SET email = ? WHERE id = ?', [email, id]);
  },
};

export default { usersAdapter, setUsersSqliteDb };
