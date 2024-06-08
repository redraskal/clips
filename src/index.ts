import { ZodError, z } from "zod";
import { db } from "./database";
import { migrate } from "bun-migrate";

try {
	z.object({
		DISCORD_CLIENT_ID: z.string(),
		DISCORD_CLIENT_SECRET: z.string(),
		DISCORD_REDIRECT_URI: z.string(),
	}).parse(process.env);
} catch (e) {
	if (e instanceof ZodError) {
		const missing = e.errors.map((error) => error.path).join(", ");
		console.error(`Missing environmental variables: ${missing}`);
		process.exit(1);
	}
}

await migrate(db);
