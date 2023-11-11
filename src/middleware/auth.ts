import { MatchedRoute } from "bun";
import { RouteError } from "gateway";
import { database } from "../database";
import { Sessions } from "../schema/sessions";
import { eq } from "drizzle-orm";
import { Accounts } from "../schema/accounts";

export function parseCookie(req: Request) {
	return req.headers
		.get("cookie")
		?.split(";")
		.reduce(
			(cookie, entry) => {
				var [name, value] = entry.trim().split("=");
				cookie[decodeURIComponent(name)] = decodeURIComponent(value);
				return cookie;
			},
			{} as Record<string, string>
		);
}

export function sessionToken(req: Request) {
	const jsonToken = req.headers.get("authorization");
	const cookie = parseCookie(req)?.["clips"] || null;
	return jsonToken ? jsonToken : cookie;
}

export function inferAccount(req: Request): typeof Accounts.$inferSelect | undefined {
	// @ts-ignore
	if (req._account) return req._account;
	const token = sessionToken(req);
	const session = token ? database.select().from(Sessions).where(eq(Sessions.id, token)).get() : null;
	if (!session) return undefined;
	const account = database.select().from(Accounts).where(eq(Accounts.id, session.account_id)).get();
	// @ts-ignore
	req._account = account;
	return account;
}

export function ensureSignedIn() {
	return function (_target: any, _descriptorKey: any, descriptor: any) {
		const original = descriptor.value;
		descriptor.value = function (req: Request, route: MatchedRoute) {
			if (!inferAccount(req)) {
				throw new RouteError("User not signed in", "/login");
			}
			return original.call(this, req, route);
		};
	};
}

export function ensureSignedOut() {
	return function (_target: any, _descriptorKey: any, descriptor: any) {
		const original = descriptor.value;
		descriptor.value = function (req: Request, route: MatchedRoute) {
			if (inferAccount(req)) {
				throw new RouteError("User signed in", "/");
			}
			return original.call(this, req, route);
		};
	};
}
