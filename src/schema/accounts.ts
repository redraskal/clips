import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const Accounts = sqliteTable("accounts", {
	id: text("id").primaryKey(), // cannot use $defaultFn with prepared statements on drizzle :(
	username: text("username").notNull(),
	discord_id: text("discord_id").notNull().unique(),
	discord_avatar_hash: text("discord_avatar_hash"),
});
