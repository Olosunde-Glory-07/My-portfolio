import pkg from 'pg';
const { Pool } = pkg;

// Connect to Neon database using environment variable
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Needed for Neon
});

// Admin password from environment variables
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function handler(event) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { section, content, password } = JSON.parse(event.body || '{}');

    if (!section || !content) {
      return { statusCode: 400, body: 'Missing section or content' };
    }

    if (password !== ADMIN_PASSWORD) {
      return { statusCode: 401, body: 'Unauthorized: Wrong password' };
    }

    // Update the content in the database
    const res = await pool.query(
      `UPDATE portfolio_content SET content=$1 WHERE section=$2 RETURNING *`,
      [content, section]
    );

    // If section does not exist, insert it
    if (res.rowCount === 0) {
      await pool.query(
        `INSERT INTO portfolio_content (section, content) VALUES ($1, $2)`,
        [section, content]
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `${section} updated successfully!` })
    };

  } catch (err) {
    console.error('Error updating content:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', details: err.message })
    };
  }
}
