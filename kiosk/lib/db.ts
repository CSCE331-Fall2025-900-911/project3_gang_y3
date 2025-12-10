import { Pool, QueryResult } from 'pg';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set. Database queries will fail until it is configured.');
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function listPublicTables(): Promise<string[]> {
  const res: QueryResult<{ tablename: string }> = await pool.query(
    "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename"
  );
  return res.rows.map((r) => r.tablename);
}

export async function closePool() {
  await pool.end();
}

export async function getMenuItems(limit = 100) {
  const cols = await getTableColumns('menu');

  const pick = (candidates: string[]) => candidates.find((c) => cols.includes(c));

  const idCol = pick(['id', 'menu_id', 'menuid', 'item_id', 'menuid', 'uid']);
  const nameCol = pick(['name', 'item_name', 'title', 'menu_name']);
  const priceCol = pick(['price', 'cost', 'unit_price', 'amount']);
  const categoryCol = pick(['category', 'type', 'group', 'category_name']);

  if (!nameCol || !priceCol) {
    throw new Error(`menu table missing required columns (name/price). available: ${cols.join(', ')}`);
  }

  const selectCols = [
    idCol ? `${idCol} as id` : `NULL as id`,
    `${nameCol} as name`,
    `${priceCol} as price`,
    categoryCol ? `${categoryCol} as category` : `NULL as category`,
    `availability`
  ].join(', ');

  const res = await pool.query(`SELECT ${selectCols} FROM menu LIMIT $1`, [limit]);
  return res.rows.map((r: any) => ({ id: r.id ?? null, name: r.name, price: Number(r.price), category: r.category ?? null, availability: r.availability }));
}

export async function getTableColumns(table: string) {
  const res = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
    [table]
  );
  return res.rows.map((r) => r.column_name);
}
