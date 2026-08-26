const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // service role key: server-side only, bypasses RLS
);

const VALID_SECTIONS = ['about', 'skills', 'resume'];

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { section, content, password } = body;

  if (!section || content === undefined || !password) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing section, content, or password' }) };
  }
  if (!VALID_SECTIONS.includes(section)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Unknown section' }) };
  }

  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!passwordHash) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server missing ADMIN_PASSWORD_HASH' }) };
  }

  let passwordOk = false;
  try {
    passwordOk = await bcrypt.compare(password, passwordHash);
  } catch {
    return { statusCode: 500, body: JSON.stringify({ error: 'Password check failed' }) };
  }
  if (!passwordOk) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Incorrect password' }) };
  }

  try {
    const { error } = await supabase
      .from('content')
      .upsert(
        { section, data: content, updated_at: new Date().toISOString() },
        { onConflict: 'section' }
      );
    if (error) throw error;
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'Database write failed' }) };
  }
};