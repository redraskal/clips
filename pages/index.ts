import { Data, Route, html } from "gateway";
import { inferAccount } from "../src/middleware/auth";
import { meta } from "../src/templates/meta";
import { database } from "../src/database";
import { Clips } from "../src/schema/clips";
import { site } from "../src/templates/site";

export default class implements Route {
	async data(req: Request) {
		const clips = database.select().from(Clips).all();

		return {
			user: inferAccount(req),
			recentlyUploaded: clips,
		};
	}

	head() {
		return meta({
			title: "Home",
		});
	}

	body(data: Data<this>) {
		// prettier-ignore
		return site("/", html`
			<input type="text" placeholder="Search" />
			<h2>Recently uploaded</h2>
			<ul class="clips">
				${data.recentlyUploaded.map(
					(clip) => html`
						<li onclick="watch('${clip.id}')">
							<video src="/content/${clip.uploader_id}/${clip.id}.mp4" poster="/content/${clip.uploader_id}/${clip.id}.jpg" muted loop preload="none" onmouseover="this.play()" onmouseout="this.pause()"></video>
							<h3>${clip.title}</h3>
						</li>
					`
				)}
			</ul>
			<h2>From friends</h2>
			<script>
				function watch(id) {
					window.location.href = "/watch/" + id;
				}
			</script>
		`);
	}
}
