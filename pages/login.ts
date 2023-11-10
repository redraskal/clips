import { Data, Route, html } from "gateway";
import { ensureSignedOut } from "../src/middleware/auth";
import { meta } from "../src/templates/meta";
import { MatchedRoute } from "bun";
import { accounts } from "../src/schema/accounts";
import { database } from "../src/database";
import { sessions } from "../src/schema/sessions";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const authorization = `Basic ${btoa(`${process.env.DISCORD_CLIENT_ID}:${process.env.DISCORD_CLIENT_SECRET}`)}`;

export default class implements Route {
	@ensureSignedOut()
	async data(_: Request, route: MatchedRoute) {
		const code = route.query.code;
		if (!code) return {};

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
		}).then((res) => res.json());

		if (!token.access_token) throw new Error("Could not authenticate Discord account.");
		const me = await fetch("https://discord.com/api/oauth2/@me", {
			headers: {
				Authorization: `Bearer ${token.access_token}`,
			},
		}).then((res) => res.json());

		if (!me.user) throw new Error("Could not authenticate Discord account.");

		// https://github.com/drizzle-team/drizzle-orm/issues/777
		database
			.insert(accounts)
			.values({
				discord_id: me.user.id,
				username: me.user.username,
				discord_avatar_hash: me.user.avatar,
			})
			.onConflictDoUpdate({
				target: accounts.id,
				set: {
					discord_avatar_hash: me.user.avatar,
				},
			})
			.returning({
				id: accounts.id,
			})
			.onConflictDoNothing()
			.get();

		// returning does not actually work with Bun right now
		const user = database.select().from(accounts).where(eq(accounts.discord_id, me.user.id)).get();
		console.log(user);

		// temp because broken things
		const sessionID = nanoid();
		database
			.insert(sessions)
			.values({
				id: sessionID,
				account_id: user!.id,
			})
			.returning()
			.get();

		return {
			token: sessionID,
		};
	}

	head() {
		return meta({
			title: "Login",
		});
	}

	body(data: Data<this>) {
		if (data?.token) {
			return Response.redirect("/", {
				headers: {
					"set-cookie": `clips=${encodeURIComponent(data.token)}; Secure; HttpOnly`,
				},
			});
		}

		return html`
			<main>
				<h1>Clips</h1>
				<p>Sign in</p>
				<button onclick="window.location.href = '${process.env.DISCORD_OAUTH_URL}'">Sign in with Discord</button>
			</main>
		`;
	}
}
