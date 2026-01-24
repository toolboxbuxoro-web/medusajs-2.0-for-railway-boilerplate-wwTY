export default async function listCols({ container }) {
  const pg = container.resolve("__pg_connection__")
  const table = "order_item"
  console.log(`\n--- ${table} (NON-NULLABLE) ---`)
  const res = await pg.raw(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = ? AND is_nullable = 'NO'
    ORDER BY ordinal_position
  `, [table])
  console.table(res.rows)
}
