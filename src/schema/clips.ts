import { int, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { snowflake } from "../snowflake";
import { Accounts } from "./accounts";

export const Clips = sqliteTable("clips", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => snowflake().toString()),
	title: text("title").notNull(),
	description: text("description"),
	uploader_id: text("uploader_id")
		.notNull()
		.references(() => Accounts.id),
	video_duration: real("video_duration").notNull(),
	views: int("views").notNull().default(0),
});
