import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { snowflake } from "../snowflake";

export const accounts = sqliteTable("accounts", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => snowflake().toString()),
	username: text("username").notNull(),
	discord_id: text("discord_id").notNull(),
	discord_avatar_hash: text("discord_avatar_hash"),
});
