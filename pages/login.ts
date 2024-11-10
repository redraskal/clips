import { type Data, Route, cache, html, meta } from "gateway";
import { ensureSignedOut } from "../src/middleware/auth";
import type { MatchedRoute } from "bun";
import { db } from "../src/database";
import { site } from "../src/templates/site";
import { style } from "../src/templates/style";
import { snowflake } from "../src/snowflake";
import { nanoid } from "nanoid";
import { whitelist } from "../src/utils";
import { fetchDiscordUser } from "../src/discord";

const insertAccount = db.query(`
	insert into accounts (id, discord_id, username, discord_avatar_hash) 
	values ($account_id, $discord_id, $username, $discord_avatar_hash)
	on conflict(discord_id) do update set discord_avatar_hash=$discord_avatar_hash
`);
const selectAccountId = db.query<
	{
		id: string;
	},
	{
		discord_id: string;
	}
>("select id from accounts where discord_id=:discord_id");
const insertSession = db.query("insert into sessions (id, account_id) values ($session_id, $account_id)");

@cache("head")
export default class implements Route {
	@ensureSignedOut()
	async data(req: Request, route: MatchedRoute) {
		if (req.method != "GET") return;

		const code = route.query.code;
		if (!code) return;

		const user = await fetchDiscordUser(code);

		if (!user) {
			throw new Error("Could not authenticate Discord account.");
		}

		if (!whitelist.includes(user.id)) throw new Error("Account not whitelisted.");

		const session_id = nanoid(50);

		insertAccount.run({
			account_id: snowflake().toString(),
			discord_id: user.id,
			username: user.username,
			discord_avatar_hash: user.avatar,
		});

		const account = selectAccountId.get({
			discord_id: user.id,
		});

		if (!account) {
			throw new Error("Error while creating account.");
		}

		insertSession.run({
			session_id,
			account_id: account.id,
		});

		return {
			token: session_id,
		};
	}

	head() {
		return (
			meta({
				title: "Login | Clips",
			}) + style
		);
	}

	body(data: Data<this>, err?: Error) {
		if (data?.token) {
			const response = Response.redirect("/", 302);
			const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();

			response.headers.set(
				"Set-Cookie",
				`clips=${encodeURIComponent(data.token)}; Expires=${expiresAt}; SameSite=Strict; Secure; HttpOnly`
			);

			return response;
		}

		return site({
			path: "/login",
			body: html`
				<h1>Login</h1>
				${err && html`<p>${err.message}</p>`}
				<form action="https://discord.com/api/oauth2/authorize">
					<input type="hidden" name="client_id" value="${process.env.DISCORD_CLIENT_ID}" />
					<input type="hidden" name="redirect_uri" value="${process.env.DISCORD_REDIRECT_URI}" />
					<input type="hidden" name="response_type" value="code" />
					<input type="hidden" name="scope" value="identify" />
					<input type="submit" value="Sign in with Discord" />
				</form>
			`,
		});
	}
}
