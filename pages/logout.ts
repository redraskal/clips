import { Route } from "gateway";
import { ensureSignedIn, sessionToken } from "../src/middleware/auth";
import { db } from "../src/database";

const deleteSessionByID = db.query<undefined, string>("delete from sessions where id=?");

export default class implements Route {
	@ensureSignedIn()
	async data(req: Request) {
		const token = sessionToken(req);

		if (token) {
			deleteSessionByID.run(token);
		}

		return {};
	}

	body() {
		const response = Response.redirect("/login", 302);
		response.headers.set("Set-Cookie", "clips=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT");
		return response;
	}
}
