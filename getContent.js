import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL
});

export async function handler(event, context) {
    const section = event.queryStringParameters.section;
    try {
        const res = await pool.query('SELECT content FROM portfolio_content WHERE section=$1', [section]);
        if (res.rows.length > 0) {
            return { statusCode: 200, body: JSON.stringify(res.rows[0].content) };
        }
        return { statusCode: 404, body: 'Not Found' };
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify(err) };
    }
}
