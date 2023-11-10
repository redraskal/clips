import { Route, html } from "gateway";
import { ensureSignedIn, sessionToken } from "../src/middleware/auth";
import { sessions } from "../src/schema/sessions";
import { database } from "../src/database";
import { eq } from "drizzle-orm";

export default class implements Route {
	@ensureSignedIn()
	async data(req: Request) {
		const token = sessionToken(req);
		if (!token) return {};
		database.delete(sessions).where(eq(sessions.id, token));
		return {};
	}

	head() {
		return html` <title>Hello world!</title> `;
	}

	body() {
		return Response.redirect("/login", {
			headers: {
				"Set-Cookie": "clips=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT",
			},
		});
	}
}
