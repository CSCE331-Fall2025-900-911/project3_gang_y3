
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

try {
    const envConfig = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
    envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            process.env[match[1]] = match[2].trim();
        }
    });
} catch (e) {
    console.log('Error reading .env.local', e);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function main() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Add columns if they don't exist
        await client.query(`
      ALTER TABLE customer 
      ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE,
      ADD COLUMN IF NOT EXISTS password VARCHAR(255),
      ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0
    `);

        console.log("Updated customer table.");
        await client.query('COMMIT');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
