import { MatchedRoute } from "bun";
import { Data, Route, html, meta } from "gateway";
import { database } from "../src/database";
import { inferAccount } from "../src/middleware/auth";
import { Clips } from "../src/schema/clips";
import { Accounts } from "../src/schema/accounts";
import { desc, eq, sql } from "drizzle-orm";
import { clipPreviews } from "../src/templates/clipPreviews";
import { site } from "../src/templates/site";
import { dateTimeFormat } from "../src/utils";
import { snowflakeToDate } from "../src/snowflake";
import { style } from "../src/templates/style";

const selectAccount = database
	.select({
		id: Accounts.id,
		username: Accounts.username,
		discord_id: Accounts.discord_id,
		discord_avatar_hash: Accounts.discord_avatar_hash,
	})
	.from(Accounts)
	.where(eq(Accounts.username, sql.placeholder("username")))
	.prepare();

const selectClips = database
	.select({
		id: Clips.id,
		uploader_id: Clips.uploader_id,
		title: Clips.title,
		username: Accounts.username,
		video_duration: Clips.video_duration,
		views: Clips.views,
	})
	.from(Clips)
	.where(eq(Clips.uploader_id, sql.placeholder("uploader_id")))
	.leftJoin(Accounts, eq(Clips.uploader_id, Accounts.id))
	.orderBy(desc(Clips.id))
	.prepare();

export default class implements Route {
	async data(req: Request, route: MatchedRoute) {
		if (!route.params.slug.startsWith("@")) return;

		const account = selectAccount.get({ username: route.params.slug.slice(1) });

		if (!account) throw new Error("Account not found");

		const clips = selectClips.all({ uploader_id: account.id });

		return {
			_account: inferAccount(req),
			account,
			clips,
		};
	}

	head(data: Data<this>) {
		return (
			meta({
				title: data ? data.account.username + " | Clips" : "404 | Clips",
			}) + style
		);
	}

	body(data: Data<this>) {
		if (!data) return Response.redirect("/404");

		return site({
			path: `/@${data.account.username}`,
			account: data._account,
			body: html`
				${data.account.discord_avatar_hash
					? html`
							<br />
							<img
								src="https://cdn.discordapp.com/avatars/${data.account.discord_id}/${data.account
									.discord_avatar_hash}.png"
							/>
						`
					: ""}
				<h2>${data.account.username}</h2>
				<p>Registered ${dateTimeFormat.format(snowflakeToDate(BigInt(data.account.id)))}</p>
				${data.clips.length > 0 ? clipPreviews(data.clips) : html`<p>No clips found.</p>`}
				<script>
					function watch(id) {
						window.location.href = "/watch/" + id;
					}
				</script>
			`,
		});
	}
}
