import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL
});

export async function handler(event, context) {
    const { section, content, password } = JSON.parse(event.body);

    if(password !== process.env.ADMIN_PASSWORD) {
        return { statusCode: 403, body: 'Unauthorized' };
    }

    try {
        await pool.query(
            `INSERT INTO portfolio_content(section, content)
             VALUES($1, $2)
             ON CONFLICT (section) DO UPDATE SET content = $2`,
            [section, content]
        );
        return { statusCode: 200, body: 'Saved' };
    } catch(err) {
        return { statusCode: 500, body: JSON.stringify(err) };
    }
}
