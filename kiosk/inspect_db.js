
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually read .env.local
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
    try {
        // Check authentication table structure
        const res = await pool.query("SELECT * FROM authentication LIMIT 1");
        if (res.rows.length > 0) {
            console.log("Columns:", Object.keys(res.rows[0]));
            console.log("Sample row (values hidden):", "Row exists");
        } else {
            console.log("Table 'authentication' found but empty.");
        }

        // Get column details
        const schemaRes = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'authentication'");
        console.log("Schema:", schemaRes.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
