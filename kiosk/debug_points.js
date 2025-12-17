
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
    try {
        const userRes = await pool.query("SELECT * FROM customer WHERE username = 'joshua'");
        if (userRes.rows.length === 0) {
            console.log("User 'joshua' not found.");
            return;
        }
        const user = userRes.rows[0];
        console.log("User Data:", user);

        const ordersRes = await pool.query("SELECT * FROM orders WHERE customer_id = $1", [user.customer_id]);
        console.log("Orders count for user:", ordersRes.rows.length);
        console.log("Recent Orders:", ordersRes.rows.slice(0, 3)); // Show top 3
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
