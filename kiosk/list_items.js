
const { pool, closePool } = require('./lib/db');

async function main() {
    try {
        const res = await pool.query('SELECT DISTINCT item_name FROM menu ORDER BY item_name');
        console.log(JSON.stringify(res.rows.map(r => r.item_name), null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        closePool();
    }
}

main();
