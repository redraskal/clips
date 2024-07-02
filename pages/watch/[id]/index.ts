import type { MatchedRoute } from "bun";
import { Route, html, meta, type Data } from "gateway";
import { db } from "../../../src/database";
import { site } from "../../../src/templates/site";
import { inferAccount } from "../../../src/middleware/auth";
import { z } from "zod";
import { style } from "../../../src/templates/style";
import { join } from "path";
import { unlink } from "fs/promises";
import { admins, pluralize, storagePath } from "../../../src/utils";

const websiteRoot = process.env.WEBSITE_ROOT || "";

const editSchema = z
	.object({
		title: z.string().min(1).trim().optional(),
		description: z.string().trim().optional(),
	})
	.partial()
	.refine((data) => !!data.title || !!data.description, "title or description must be present.");

export const selectClip = db.query(`
	select clips.id, clips.title, clips.description, clips.uploader_id, clips.video_duration, clips.views, accounts.discord_id, accounts.username
	from clips
	left join accounts on clips.uploader_id=accounts.id
	where clips.id=?
`);
const incrementViews = db.query("update clips set views=views+1 where id=?");
const editClip = db.query(`update clips set title=$title, description=$description where id=$id`);
const deleteClipByID = db.query("delete from clips where id=?");

export default class implements Route {
	async data(req: Request, route: MatchedRoute) {
		const data = selectClip.get(route.params.id) as {
			id: string;
			title: string;
			description: string | null;
			uploader_id: string;
			video_duration: number;
			views: number;
			username: string | null;
			discord_id: string | null;
		} | null;

		if (!data || !data.discord_id) throw new Error("Clip not found.");

		const account = inferAccount(req);
		const editable = account && (account.id == data.uploader_id || admins.includes(account.discord_id));

		if (req.method == "POST" || req.method == "DELETE") {
			if (!editable) {
				throw new Error("Account is not uploader.");
			}

			if (req.headers.get("accept") == "application/json" && req.method == "POST") {
				const body = await editSchema.parseAsync(await req.json());

				editClip.run({
					id: route.params.id,
					title: body.title || data.title,
					description: body.description || data.description,
				});

				return { _edited: true };
			} else if (req.method == "DELETE" || (await req.formData()).get("_method") == "DELETE") {
				const root = join(storagePath, data.uploader_id);

				for (const ext of ["mp4", "jpg"]) {
					await unlink(join(root, `${data.id}.${ext}`));
				}

				deleteClipByID.run(route.params.id);

				return { _deleted: true };
			}
		}

		return {
			_root: `/content/${data.uploader_id}/${data.id}`,
			_account: account,
			...data,
			editable,
		};
	}

	head(data: Data<this>) {
		if (!data || data._edited != undefined || data._deleted != undefined) return "";

		return (
			meta({
				title: data.title,
				description: data.description,
			}) +
			style +
			html` <link rel="alternate" type="application/json+oembed" href="${websiteRoot}/watch/${data.id}/oembed.json" /> `
		);
	}

	body(data: Data<this>) {
		if (data._edited != undefined || data._deleted != undefined) return Response.redirect("/", 302);

		// only increment views when clip is seen in a browser
		incrementViews.run(data.id);
		data.views += 1;

		const views = pluralize(data.views, "view");

		// description must contain no whitespace because css :empty is fun
		// prettier-ignore
		return site({
			path: `/watch/${data.id}`,
			account: data._account,
			body: html`
				<video src="${data._root}.mp4" poster="${data._root}.jpg" autoplay muted controls loop></video>
				<h1 ${data.editable && "contenteditable"}>${data.title}</h1>
				<p><a href="/@${data.username}">${data.username}</a> • ${views}</p>
				<p ${data.editable && 'placeholder="Click to edit description." contenteditable'}>${data.description}</p>
				<a href="${data._root}.mp4" download="${data.title}.mp4"><button>Download</button></a>
				${data.editable
					&& html`
							<form method="POST">
								<input type="hidden" name="_method" value="DELETE" />
								<input type="submit" value="Delete" />
							</form>
							<script src="/js/clips/edit.js"></script>
						`}
				<script src="/js/clips/watch.js"></script>
			`,
		});
	}
}
