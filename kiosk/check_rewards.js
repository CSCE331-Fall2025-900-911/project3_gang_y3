
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
        const res = await pool.query("SELECT item_name FROM menu WHERE item_name ILIKE '%taro%' OR item_name ILIKE '%popcorn%' OR item_name ILIKE '%fries%' OR item_name ILIKE '%brown sugar%'");
        console.log("Found Items:", res.rows.map(r => r.item_name));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

main();
