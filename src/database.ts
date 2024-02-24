import Database from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

export const sqlite = new Database(process.env.DATABASE || "clips.sqlite");
export const database = drizzle(sqlite);

if (process.env.DATABASE_MIGRATE) {
	migrate(database, { migrationsFolder: "./drizzle" });
}
