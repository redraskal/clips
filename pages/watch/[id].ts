import { MatchedRoute } from "bun";
import { Data, Route, html } from "gateway";
import { meta } from "../../src/templates/meta";
import { database } from "../../src/database";
import { Clips } from "../../src/schema/clips";
import { eq, sql } from "drizzle-orm";
import { Accounts } from "../../src/schema/accounts";
import { site } from "../../src/templates/site";
import { inferAccount } from "../../src/middleware/auth";
import { z } from "zod";

const editSchema = z
	.object({
		title: z.string().min(1).trim().optional(),
		description: z.string().trim().optional(),
	})
	.partial()
	.refine((data) => !!data.title || !!data.description, "title or description must be present.");

export default class implements Route {
	async data(req: Request, route: MatchedRoute) {
		const data = database
			.select()
			.from(Clips)
			.where(eq(Clips.id, route.params.id))
			.leftJoin(Accounts, eq(Clips.uploader_id, Accounts.id))
			.get();

		if (!data || !data.clips || !data.accounts) throw new Error("Clip not found.");

		database
			.update(Clips)
			.set({
				views: sql`${Clips.views} + 1`,
			})
			.where(eq(Clips.id, route.params.id))
			.run();

		const account = inferAccount(req);

		if (req.method == "POST") {
			const body = await editSchema.parseAsync(await req.json());

			if (account?.id != data.clips.uploader_id) throw new Error("Account is not uploader.");

			database.update(Clips).set(body).where(eq(Clips.id, route.params.id)).run();

			return {};
		}

		return {
			_root: `/content/${data.clips.uploader_id}/${data.clips.id}`,
			clip: data.clips,
			uploader: data.accounts,
			_account: inferAccount(req),
		};
	}

	head(data: Data<this>) {
		return meta({
			title: data.clip!.title,
			description: data.clip!.description || undefined,
			image: `${data._root}.jpg`,
			video: `${process.env.WEBSITE_ROOT || ""}/content/${data.clip!.uploader_id}/${data.clip!.id}.mp4`,
		});
	}

	body(data: Data<this>) {
		const editable = data._account?.id == data.clip!.uploader_id;
		data.clip!.views += 1;

		const views = html`${data.clip!.views} view${data.clip!.views != 1 ? "s" : ""}`;

		return site({
			path: `/watch/${data.clip!.id}`,
			account: data._account,
			body: html`
				<video src="${data._root}.mp4" poster="${data._root}.jpg" autoplay muted controls loop download></video>
				<h1 ${editable ? "contenteditable" : ""}>${data.clip!.title}</h1>
				<p><a href="/@${data.uploader!.username}">${data.uploader!.username}</a> • ${views}</p>
				<p ${editable ? 'placeholder="Click to edit description." contenteditable' : ""}>
					${data.clip!.description || ""}
				</p>
				<a href="${data._root}.mp4" download="${data.clip!.title}.mp4"><button>Download</button></a>
				${editable ? html`<script src="/js/clips/edit.js"></script>` : ""}
			`,
		});
	}
}
