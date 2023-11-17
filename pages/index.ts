import { Data, Route, html } from "gateway";
import { inferAccount } from "../src/middleware/auth";
import { meta } from "../src/templates/meta";
import { database } from "../src/database";
import { Clips } from "../src/schema/clips";
import { site } from "../src/templates/site";
import { desc, eq, ne } from "drizzle-orm";
import { clipPreviews } from "../src/templates/clipPreviews";
import { Accounts } from "../src/schema/accounts";

export default class implements Route {
	async data(req: Request) {
		const account = inferAccount(req);

		const recentlyUploaded = account
			? database
					.select({
						id: Clips.id,
						uploader_id: Clips.uploader_id,
						title: Clips.title,
						username: Accounts.username,
						video_duration: Clips.video_duration,
						views: Clips.views,
					})
					.from(Clips)
					.where(eq(Clips.uploader_id, account.id))
					.leftJoin(Accounts, eq(Clips.uploader_id, Accounts.id))
					.orderBy(desc(Clips.id))
					.limit(8)
					.all()
			: [];

		const fromFriends = database
			.select({
				id: Clips.id,
				uploader_id: Clips.uploader_id,
				title: Clips.title,
				username: Accounts.username,
				video_duration: Clips.video_duration,
				views: Clips.views,
			})
			.from(Clips)
			.where(ne(Clips.uploader_id, account?.id || "0"))
			.leftJoin(Accounts, eq(Clips.uploader_id, Accounts.id))
			.orderBy(desc(Clips.id))
			.limit(16)
			.all();

		return {
			_account: account,
			recentlyUploaded,
			fromFriends,
		};
	}

	head() {
		return meta({
			title: "Home",
		});
	}

	body(data: Data<this>) {
		// prettier-ignore
		return site({
			path: "/",
			account: data._account,
			body: html`
				${data.recentlyUploaded.length > 0 ? html`
					<h2>Recently uploaded</h2>
					${clipPreviews(data.recentlyUploaded)}
					<a href="/@${data._account?.username}">More clips -></a>
				` : ""}
				<h2>From friends</h2>
				${clipPreviews(data.fromFriends)}
				<script>
					function watch(id) {
						window.location.href = "/watch/" + id;
					}
				</script>
			`
		});
	}
}
