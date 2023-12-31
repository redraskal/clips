import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { snowflake } from "../snowflake";

export const Accounts = sqliteTable("accounts", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => snowflake().toString()),
	username: text("username").notNull(),
	discord_id: text("discord_id").notNull().unique(),
	discord_avatar_hash: text("discord_avatar_hash"),
});
