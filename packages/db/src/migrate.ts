import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/wine_app";
const migrationClient = postgres(connectionString, { max: 1 });

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = join(__dirname, "..", "drizzle");

async function main() {
  const db = drizzle(migrationClient);
  await migrate(db, { migrationsFolder });
  await migrationClient.end();
  console.log("Migrations complete.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
