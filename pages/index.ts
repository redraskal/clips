import { type Data, Route, cache, html, meta } from "gateway";
import { inferAccount } from "../src/middleware/auth";
import { db } from "../src/database";
import { site } from "../src/templates/site";
import { clipPreviews, type ClipPreview } from "../src/templates/clipPreviews";
import { style } from "../src/templates/style";

const selectRecentlyUploadedClips = db.query<ClipPreview, string>(`
	select clips.id, clips.uploader_id, clips.title, clips.video_duration, clips.views, accounts.username
	from clips
	left join accounts on clips.uploader_id=accounts.id
	where clips.uploader_id=?
	order by clips.id desc
	limit 8
`);

const selectClipsFromFriends = db.query<ClipPreview, string>(`
	select clips.id, clips.uploader_id, clips.title, clips.video_duration, clips.views, accounts.username
	from clips
	left join accounts on clips.uploader_id=accounts.id
	where clips.uploader_id!=?
	order by clips.id desc
	limit 16
`);

@cache("head")
export default class implements Route {
	async data(req: Request) {
		const account = inferAccount(req);

		const recentlyUploaded = account ? selectRecentlyUploadedClips.all(account.id) : [];
		const fromFriends = selectClipsFromFriends.all(account?.id || "0");

		return {
			_account: account,
			recentlyUploaded,
			fromFriends,
		};
	}

	head() {
		return (
			meta({
				title: "Home | Clips",
			}) + style
		);
	}

	body(data: Data<this>) {
		return site({
			path: "/",
			account: data._account,
			body: html`
				${data.recentlyUploaded.length > 0
					? html`
							<h2>Recently uploaded</h2>
							${clipPreviews(data.recentlyUploaded)}
							<a href="/@${data._account?.username}">More clips -></a>
						`
					: ""}
				${data.fromFriends.length > 0
					? html`
							<h2>From friends</h2>
							${clipPreviews(data.fromFriends)}
						`
					: ""}
			`,
		});
	}
}
