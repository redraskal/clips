import type { MatchedRoute } from "bun";
import { Route, html, meta, type Data } from "gateway";
import { database } from "../../src/database";
import { Clips } from "../../src/schema/clips";
import { eq, sql } from "drizzle-orm";
import { Accounts } from "../../src/schema/accounts";
import { site } from "../../src/templates/site";
import { inferAccount } from "../../src/middleware/auth";
import { z } from "zod";
import { style } from "../../src/templates/style";
import { join } from "path";
import { unlink } from "fs/promises";
import { admins } from "../../src/whitelist";
import { pluralize } from "../../src/utils";

const editSchema = z
	.object({
		title: z.string().min(1).trim().optional(),
		description: z.string().trim().optional(),
	})
	.partial()
	.refine((data) => !!data.title || !!data.description, "title or description must be present.");

const selectClip = database
	.select()
	.from(Clips)
	.where(eq(Clips.id, sql.placeholder("id")))
	.leftJoin(Accounts, eq(Clips.uploader_id, Accounts.id))
	.prepare();

const incrementViews = database
	.update(Clips)
	.set({
		views: sql`${Clips.views} + 1`,
	})
	.where(eq(Clips.id, sql.placeholder("id")))
	.prepare();

export default class implements Route {
	async data(req: Request, route: MatchedRoute) {
		const data = selectClip.get({ id: route.params.id });

		if (!data || !data.clips || !data.accounts) throw new Error("Clip not found.");

		const account = inferAccount(req);
		const editable = account && (account.id == data.clips.uploader_id || admins.includes(account.discord_id));

		if (req.method == "POST" || req.method == "DELETE") {
			if (!editable) {
				throw new Error("Account is not uploader.");
			}

			if (req.headers.get("accept") == "application/json" && req.method == "POST") {
				const body = await editSchema.parseAsync(await req.json());

				// TODO: this does not work well as a prepared statement on drizzle with a dynamic body
				database.update(Clips).set(body).where(eq(Clips.id, route.params.id)).run();

				return { edited: true };
			} else if (req.method == "DELETE" || (await req.formData()).get("_method") == "DELETE") {
				const root = join(process.env.STORAGE_PATH!, data.clips.uploader_id);

				for (const ext of ["mp4", "jpg"]) {
					await unlink(join(root, data.clips.id + "." + ext));
				}

				database.delete(Clips).where(eq(Clips.id, route.params.id)).run();

				return { deleted: true };
			}
		}

		return {
			_root: `/content/${data.clips.uploader_id}/${data.clips.id}`,
			_account: account,
			clip: data.clips,
			uploader: data.accounts,
			editable,
		};
	}

	head(data: Data<this>) {
		return (
			meta({
				title: data.clip!.title + " | Clips",
				description: data.clip!.description || undefined,
				imageURL: `${process.env.WEBSITE_ROOT || ""}${data._root}.jpg`,
			}) + style
		);
	}

	body(data: Data<this>) {
		if (data.deleted) return Response.redirect("/", 302);

		incrementViews.run({ id: data.clip!.id });
		data.clip!.views += 1;

		const views = pluralize(data.clip!.views, "view");

		// description must contain no whitespace because css :empty is fun
		// prettier-ignore
		return site({
			path: `/watch/${data.clip!.id}`,
			account: data._account,
			body: html`
				<video src="${data._root}.mp4" poster="${data._root}.jpg" autoplay muted controls loop download></video>
				<h1 ${data.editable ? "contenteditable" : ""}>${data.clip!.title}</h1>
				<p><a href="/@${data.uploader!.username}">${data.uploader!.username}</a> • ${views}</p>
				<p ${data.editable && 'placeholder="Click to edit description." contenteditable'}>${data.clip!.description || ""}</p>
				<a href="${data._root}.mp4" download="${data.clip!.title}.mp4"><button>Download</button></a>
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
