import type { MatchedRoute } from "bun";
import { RouteError } from "gateway";
import { db } from "../database";

export type CachedAccount = {
	id: string;
	username: string;
	discord_id: string;
	discord_avatar_hash: string | null;
};

const selectAccountBySessionID = db.query(`
	select accounts.id, accounts.username, accounts.discord_id, accounts.discord_avatar_hash 
	from accounts 
	left join sessions on sessions.account_id=accounts.id 
	where sessions.id=?
`);

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

export function inferAccount(req: Request): CachedAccount | undefined {
	// @ts-ignore
	if (req._account) return req._account;

	const token = sessionToken(req);
	const account = selectAccountBySessionID.get(token) as CachedAccount;

	if (!account) return undefined;

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
