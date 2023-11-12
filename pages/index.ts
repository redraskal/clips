import { Data, Route, html } from "gateway";
import { inferAccount } from "../src/middleware/auth";
import { meta } from "../src/templates/meta";
import { database } from "../src/database";
import { Clips } from "../src/schema/clips";
import { site } from "../src/templates/site";
import { eq, ne } from "drizzle-orm";

export default class implements Route {
	async data(req: Request) {
		const account = inferAccount(req);

		const recentlyUploaded = account
			? database.select().from(Clips).where(eq(Clips.uploader_id, account.id)).limit(8).all()
			: [];

		const fromFriends = account
			? database.select().from(Clips).where(ne(Clips.uploader_id, account.id)).limit(16).all()
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
				<ul class="clips">
					${data.recentlyUploaded.map(
						(clip) => html`
							<li onclick="watch('${clip.id}')">
								<video src="/content/${clip.uploader_id}/${clip.id}.mp4" poster="/content/${clip.uploader_id}/${clip.id}.jpg" muted loop preload="none" onmouseover="this.play()" onmouseout="this.pause()"></video>
								<b>${clip.title}</b>
								<p>${data.account!.username}</p>
							</li>
						`
					)}
				</ul>
				<h2>From friends</h2>
				<ul class="clips">
					${data.fromFriends.map(
						(clip) => html`
							<li onclick="watch('${clip.id}')">
								<video src="/content/${clip.uploader_id}/${clip.id}.mp4" poster="/content/${clip.uploader_id}/${clip.id}.jpg" muted loop preload="none" onmouseover="this.play()" onmouseout="this.pause()"></video>
								<b>${clip.title}</b>
								<p>${data.account!.username}</p>
							</li>
						`
					)}
				</ul>
				<script>
					function watch(id) {
						window.location.href = "/watch/" + id;
					}
				</script>
			`
		});
	}
}
