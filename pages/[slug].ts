import type { MatchedRoute } from "bun";
import { type Data, Route, html, meta } from "gateway";
import { db } from "../src/database";
import { inferAccount } from "../src/middleware/auth";
import { clipPreviews } from "../src/templates/clipPreviews";
import { site } from "../src/templates/site";
import { dateTimeFormat } from "../src/utils";
import { snowflakeToDate } from "../src/snowflake";
import { style } from "../src/templates/style";

const selectAccount = db.query<
	{
		id: string;
		username: string;
		discord_id: string;
		discord_avatar_hash?: string;
	} | null,
	string
>(`
	select id, username, discord_id, discord_avatar_hash
	from accounts
	where username=?
`);

const selectClips = db.query<
	{
		id: string;
		uploader_id: string;
		title: string;
		username: string | null;
		video_duration: number;
		views: number;
	},
	string
>(`
	select clips.id, clips.uploader_id, clips.title, accounts.username, clips.video_duration, clips.views
	from clips
	left join accounts on clips.uploader_id=accounts.id
	where clips.uploader_id=?
	order by clips.id desc
`);

export default class implements Route {
	async data(req: Request, route: MatchedRoute) {
		if (!route.params.slug.startsWith("@")) return;

		const account = selectAccount.get(route.params.slug.slice(1));

		if (!account) throw new Error("Account not found");

		const clips = selectClips.all(account.id);

		return {
			_account: inferAccount(req),
			account,
			clips,
		};
	}

	head(data: Data<this>) {
		return (
			meta({
				title: `${data?.account.username || "404"} | Clips`,
			}) + style
		);
	}

	body(data: Data<this>) {
		if (!data) return Response.redirect("/404", 302);

		return site({
			path: `/@${data.account.username}`,
			account: data._account,
			body: html`
				${data.account.discord_avatar_hash &&
				html`
					<br />
					<img
						src="https://cdn.discordapp.com/avatars/${data.account.discord_id}/${data.account.discord_avatar_hash}.png"
					/>
				`}
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
