import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL });

export async function handler(event, context) {
    try {
        const { section, content, password } = JSON.parse(event.body);

        // Check admin password
        if (password !== process.env.ADMIN_PASSWORD) {
            return { statusCode: 401, body: 'Unauthorized' };
        }

        const contentString = JSON.stringify(content);

        // Insert or update the content
        await pool.query(
            `INSERT INTO portfolio_content (section, content)
             VALUES ($1, $2)
             ON CONFLICT (section)
             DO UPDATE SET content = $2`,
            [section, contentString]
        );

        return { statusCode: 200, body: 'Success' };
    } catch (err) {
        console.error(err);
        return { statusCode: 500, body: JSON.stringify(err.message) };
    }
}
