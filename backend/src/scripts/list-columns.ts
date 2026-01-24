import { ExecArgs } from "@medusajs/framework/types"

export default async function listColumns({ container }: ExecArgs) {
  const pgConnection = container.resolve("__pg_connection__")
  
  const tables = ['order', 'order_item', 'order_line_item']
  
  for (const table of tables) {
    console.log(`\n--- COLUMNS FOR TABLE: ${table} ---`)
    const res = await pgConnection.raw(`
      SELECT column_name, is_nullable, column_default, data_type 
      FROM information_schema.columns 
      WHERE table_name = ?
      ORDER BY ordinal_position
    `, [table])
    console.table(res.rows)
  }
}
