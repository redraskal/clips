import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { Accounts } from "./accounts";

export const Sessions = sqliteTable("sessions", {
	id: text("id").primaryKey(),
	account_id: text("account_id")
		.notNull()
		.references(() => Accounts.id),
});
