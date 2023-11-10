import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { database } from "./database";

migrate(database, { migrationsFolder: "./drizzle" });
