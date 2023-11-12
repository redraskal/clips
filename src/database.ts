import { drizzle } from "drizzle-orm/bun-sqlite";
import Database from "bun:sqlite";

export const sqlite = new Database(process.env.DATABASE || "clips.sqlite");
export const database = drizzle(sqlite);
