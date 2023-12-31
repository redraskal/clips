import { MatchedRoute } from "bun";
import { Data, Route, html } from "gateway";
import { meta } from "../src/templates/meta";
import { sqlite } from "../src/database";
import { site } from "../src/templates/site";
import { inferAccount } from "../src/middleware/auth";
import { ClipPreview, clipPreviews } from "../src/templates/clipPreviews";
import { z } from "zod";

const schema = z.object({
	q: z
		.string()
		.min(2)
		.max(100)
		.trim()
		.transform((s) => s.replaceAll("+", " ")),
});

const query = sqlite.prepare(
	`
		SELECT * FROM (
			SELECT clip_id AS id, uploader_id, clips.title AS title, (SELECT username FROM accounts WHERE accounts.id = id) AS username, video_duration, views
				FROM clips_fts($query)
				JOIN clips ON clips_fts.clip_id = clips.id
				LIMIT 15
		)
		UNION ALL
		SELECT * FROM (
			WITH selected AS (
				SELECT account_id as uploader_id
					FROM accounts_fts($query)
					JOIN accounts ON accounts_fts.account_id = accounts.id
					LIMIT 4
			)
			SELECT clips.id as id, uploader_id, title, (SELECT username FROM accounts WHERE accounts.id = id) AS username, video_duration, views
			FROM clips
			WHERE clips.uploader_id IN selected
			ORDER BY id DESC LIMIT 12
		)`
);

export default class implements Route {
	async data(req: Request, route: MatchedRoute) {
		const data = await schema.parseAsync(route.query);
		const results = query.all({ $query: data.q }) as ClipPreview[];

		return {
			_account: inferAccount(req),
			query: data.q,
			results,
		};
	}

	head(data: Data<this>) {
		return meta({
			title: "Search results",
		});
	}

	body(data: Data<this>) {
		return site({
			path: "/",
			account: data._account,
			body: html`
				<h2>Search results for "${data.query}"</h2>
				${data.results.length > 0 ? clipPreviews(data.results) : html`<p>No results found.</p>`}
				<script>
					function watch(id) {
						window.location.href = "/watch/" + id;
					}
				</script>
			`,
		});
	}
}
