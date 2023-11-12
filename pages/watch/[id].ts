import { MatchedRoute } from "bun";
import { Data, Route, html } from "gateway";
import { meta } from "../../src/templates/meta";
import { database } from "../../src/database";
import { Clips } from "../../src/schema/clips";
import { eq, sql } from "drizzle-orm";
import { Accounts } from "../../src/schema/accounts";
import { site } from "../../src/templates/site";

export default class implements Route {
	async data(_: Request, route: MatchedRoute) {
		database
			.update(Clips)
			.set({
				views: sql`${Clips.views} + 1`,
			})
			.where(eq(Clips.id, route.params.id))
			.run();

		const data = database
			.select()
			.from(Clips)
			.where(eq(Clips.id, route.params.id))
			.leftJoin(Accounts, eq(Clips.uploader_id, Accounts.id))
			.get();

		if (!data || !data.clips || !data.accounts) throw new Error("Clip not found.");

		return {
			root: `/content/${data.clips.uploader_id}/${data.clips.id}`,
			clip: data.clips,
			uploader: data.accounts,
		};
	}

	head(data: Data<this>) {
		return meta({
			title: data.clip.title,
			description: data.clip.description || undefined,
			image: `${data.root}.jpg`,
		});
	}

	body(data: Data<this>) {
		return site({
			path: `/watch/${data.clip.id}`,
			body: html`
				<video src="${data.root}.mp4" poster="${data.root}.jpg" autoplay muted controls loop></video>
				<h1>${data.clip.title}</h1>
				<p>${data.uploader.username}</p>
				<p>${data.clip.views} view${data.clip.views != 1 ? "s" : ""}</p>
				<p>${data.clip.description || ""}</p>
			`,
		});
	}
}
