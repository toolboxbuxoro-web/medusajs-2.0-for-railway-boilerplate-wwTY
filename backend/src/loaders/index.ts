import { ensureProductSearchSchema } from "./meilisearch-settings.js"

/**
 * Loaders are functions that run during application bootstrap.
 * This ensures critical configurations are applied before the server starts.
 */
export default async function loaders() {
  // Ensure Meilisearch search schema is correctly configured
  await ensureProductSearchSchema()
}
