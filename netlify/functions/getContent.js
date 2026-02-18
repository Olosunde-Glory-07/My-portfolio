import pkg from 'pg';
const { Pool } = pkg;

// Connect to Neon database using environment variable
const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Needed for Neon
});

export async function handler(event) {
  try {
    // Get the section from query parameters
    const section = event.queryStringParameters?.section;
    if (!section) {
      return { statusCode: 400, body: 'Missing section parameter' };
    }

    // Query the database
    const res = await pool.query(
      'SELECT content FROM portfolio_content WHERE section=$1',
      [section]
    );

    if (res.rows.length === 0) {
      return { statusCode: 404, body: 'Section not found' };
    }

    // Return the content as JSON
    return {
      statusCode: 200,
      body: JSON.stringify(res.rows[0].content)
    };
  } catch (err) {
    console.error('Error fetching content:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', details: err.message })
    };
  }
}
