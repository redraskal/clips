import { int, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { snowflake } from "../snowflake";
import { accounts } from "./accounts";

export const clips = sqliteTable("clips", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => snowflake().toString()),
	title: text("title").notNull(),
	description: text("description"),
	uploader_id: text("uploader_id")
		.notNull()
		.references(() => accounts.id),
	video_duration: real("video_duration").notNull(),
	video_path: text("video_path").notNull(),
	views: int("views").notNull().default(0),
});
