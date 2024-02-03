import { Data, Route, cache, html, meta } from "gateway";
import { ensureSignedOut } from "../src/middleware/auth";
import { MatchedRoute } from "bun";
import { Accounts } from "../src/schema/accounts";
import { database } from "../src/database";
import { Sessions } from "../src/schema/sessions";
import { site } from "../src/templates/site";
import { whitelist } from "../src/whitelist";
import { style } from "../src/templates/style";
import { sql } from "drizzle-orm";
import { snowflake } from "../src/snowflake";
import { nanoid } from "nanoid";

const authorization = `Basic ${btoa(`${process.env.DISCORD_CLIENT_ID}:${process.env.DISCORD_CLIENT_SECRET}`)}`;

const insertAccount = database
	.insert(Accounts)
	.values({
		id: sql.placeholder("id"),
		discord_id: sql.placeholder("discord_id"),
		username: sql.placeholder("username"),
		discord_avatar_hash: sql.placeholder("discord_avatar_hash"),
	})
	.onConflictDoUpdate({
		target: Accounts.discord_id,
		set: {
			// @ts-ignore - this works, why is the type wrong?
			discord_avatar_hash: sql.placeholder("discord_avatar_hash"),
		},
	})
	.returning({
		id: Accounts.id,
	})
	.prepare();

const insertSession = database
	.insert(Sessions)
	.values({
		id: sql.placeholder("id"),
		account_id: sql.placeholder("account_id"),
	})
	.returning()
	.prepare();

@cache("head")
export default class implements Route {
	@ensureSignedOut()
	async data(req: Request, route: MatchedRoute) {
		if (req.method != "GET") return;

		const code = route.query.code;
		if (!code) return;

		const token = await fetch("https://discord.com/api/oauth2/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Authorization: authorization,
			},
			body: new URLSearchParams({
				grant_type: "authorization_code",
				code,
				redirect_uri: process.env.DISCORD_REDIRECT_URI!,
			}),
		}).then((res) => res.json() as { access_token?: string });

		if (!token.access_token) {
			throw new Error("Could not authenticate Discord account.");
		}

		const me = await fetch("https://discord.com/api/oauth2/@me", {
			headers: {
				Authorization: `Bearer ${token.access_token}`,
			},
		}).then((res) => res.json() as { user?: any });

		if (!me.user) {
			throw new Error("Could not authenticate Discord account.");
		}
		if (!whitelist.includes(me.user.id)) throw new Error("Account not whitelisted.");

		const session = insertSession.get({
			id: nanoid(50),
			account_id: insertAccount.get({
				id: snowflake().toString(),
				discord_id: me.user.id,
				username: me.user.username,
				discord_avatar_hash: me.user.avatar,
			}).id,
		});

		return {
			token: session.id,
		};
	}

	head() {
		return (
			meta({
				title: "Login | Clips",
			}) + style
		);
	}

	body(data: Data<this>) {
		if (data?.token) {
			const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
			return Response.redirect("/", {
				headers: {
					"set-cookie": `clips=${encodeURIComponent(data.token)}; Expires=${expiresAt}; Secure; HttpOnly`,
				},
			});
		}

		return site({
			path: "/login",
			body: html`
				<h1>Login</h1>
				<button onclick="window.location.href = '${process.env.DISCORD_OAUTH_URL}'">Sign in with Discord</button>
			`,
		});
	}
}
