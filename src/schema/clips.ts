import { int, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { Accounts } from "./accounts";

export const Clips = sqliteTable("clips", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	description: text("description"),
	uploader_id: text("uploader_id")
		.notNull()
		.references(() => Accounts.id),
	video_duration: real("video_duration").notNull(),
	views: int("views").notNull().default(0),
});
