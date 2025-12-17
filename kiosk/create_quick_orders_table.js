
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

        // Create quick_orders table
        await client.query(`
      CREATE TABLE IF NOT EXISTS quick_orders (
        quick_order_id SERIAL PRIMARY KEY,
        customer_id INTEGER REFERENCES customer(customer_id),
        order_name VARCHAR(255),
        items_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        console.log("Created quick_orders table.");
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
