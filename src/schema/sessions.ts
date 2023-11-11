import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { Accounts } from "./accounts";
import { nanoid } from "nanoid";

export const Sessions = sqliteTable("sessions", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => nanoid(50)),
	account_id: text("account_id")
		.notNull()
		.references(() => Accounts.id),
});
