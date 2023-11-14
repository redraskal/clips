import { Data, Route, html } from "gateway";
import { inferAccount } from "../src/middleware/auth";
import { meta } from "../src/templates/meta";
import { database } from "../src/database";
import { Clips } from "../src/schema/clips";
import { site } from "../src/templates/site";
import { eq, ne } from "drizzle-orm";
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
					.limit(100)
					.all()
			: [];

		const fromFriends = account
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
					.where(ne(Clips.uploader_id, account.id))
					.leftJoin(Accounts, eq(Clips.uploader_id, Accounts.id))
					.limit(100)
					.all()
			: [];

		return {
			account,
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
			account: data.account,
			body: html`
				<h2>Recently uploaded</h2>
				${clipPreviews(data.recentlyUploaded)}
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
