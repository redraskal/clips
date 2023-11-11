import { Route } from "gateway";
import { ensureSignedIn, sessionToken } from "../src/middleware/auth";
import { Sessions } from "../src/schema/sessions";
import { database } from "../src/database";
import { eq } from "drizzle-orm";

export default class implements Route {
	@ensureSignedIn()
	async data(req: Request) {
		const token = sessionToken(req);
		if (!token) return {};
		database.delete(Sessions).where(eq(Sessions.id, token));
		return {};
	}

	body() {
		return Response.redirect("/login", {
			headers: {
				"Set-Cookie": "clips=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT",
			},
		});
	}
}
