import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { accounts } from "./accounts";
import { nanoid } from "nanoid";

export const sessions = sqliteTable("sessions", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid()),
	account_id: text("account_id")
		.notNull()
		.references(() => accounts.id),
});
