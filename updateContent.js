import { Client } from "https://cdn.jsdelivr.net/npm/@neondatabase/serverless@latest/+esm";

// Get environment variables
const dbUrl = process.env.NEON_DATABASE_URL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function handler(event, context) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { section, content, password } = JSON.parse(event.body);

    // Password check
    if (password !== ADMIN_PASSWORD) {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }

    // Connect to database
    const client = new Client({ connectionString: dbUrl });
    await client.connect();

    // Depending on your database table setup, you can store JSON
    await client.query(
      `INSERT INTO portfolio_content (section, content) 
       VALUES ($1, $2)
       ON CONFLICT (section) 
       DO UPDATE SET content = $2`,
      [section, JSON.stringify(content)]
    );

    await client.end();

    return { statusCode: 200, body: JSON.stringify({ success: true }) };

  } catch (error) {
    console.error("Error updating content:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
}
