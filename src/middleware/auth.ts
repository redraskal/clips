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

/**
 * Converts a cookie's plain-text value to a Record.
 * @param req Request
 * @returns Record<string, string>, if present
 */
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

/**
 * Parses the session token of a Request from the authorization or cookie header.
 * @param req Request
 * @returns session token, as a string, if present
 */
export function sessionToken(req: Request) {
	const jsonToken = req.headers.get("authorization");
	const cookie = parseCookie(req)?.["clips"] || null;
	return jsonToken ? jsonToken : cookie;
}

/**
 * Looks up an account associated with the auth header or cookie of a Request.
 * @param req Request
 * @returns account identifiers as a CachedAccount
 */
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

/**
 * Route middleware to redirect a client to the login page if they **are not** signed in.
 *
 * The decorator attaches to a method by prepending an account check.
 */
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

/**
 * Route middleware to redirect a client to the home page if they **are** signed in.
 *
 * The decorator attaches to a method by prepending an account check.
 */
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
