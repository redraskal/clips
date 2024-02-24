import { type Data, Route, cache, html, meta } from "gateway";
import { ensureSignedIn, inferAccount } from "../src/middleware/auth";
import { mkdir } from "fs/promises";
import { join, parse } from "path";
import { database } from "../src/database";
import { Clips } from "../src/schema/clips";
import { File } from "buffer";
import { generateThumbnail, videoDuration } from "../src/ffmpeg";
import { eq, sql } from "drizzle-orm";
import { site } from "../src/templates/site";
import { style } from "../src/templates/style";
import { snowflake } from "../src/snowflake";
import { storagePath } from "../src/utils";

const insertClip = database
	.insert(Clips)
	.values({
		id: sql.placeholder("id"),
		title: sql.placeholder("title"),
		uploader_id: sql.placeholder("uploader_id"),
		video_duration: -1,
	})
	.returning()
	.prepare();

// type error is drizzle bug
const updateVideoDuration = database
	.update(Clips)
	// @ts-ignore
	.set({ video_duration: sql.placeholder("video_duration") })
	.where(eq(Clips.id, sql.placeholder("id")))
	.prepare();

@cache("head")
export default class implements Route {
	@ensureSignedIn()
	async data(req: Request) {
		if (req.method == "GET") return { _account: inferAccount(req) };
		if (req.method != "POST") return {};

		const account = inferAccount(req)!;
		const formData = await req.formData();
		const file = formData.get("file") as File;

		if (!file) throw new Error("No files specified.");
		if (file.type != "video/mp4") throw new Error("Only mp4 files are supported.");

		const root = join(storagePath, account.id);
		await mkdir(root, { recursive: true });

		const clip = insertClip.get({
			id: snowflake().toString(),
			title: parse(file.name).name,
			uploader_id: account.id,
		});

		const path = join(root, `${clip.id}.mp4`);
		await Bun.write(path, file as unknown as Blob);

		const duration = await videoDuration(path);
		await generateThumbnail(path, duration / 2, join(root, `${clip.id}.jpg`));

		updateVideoDuration.run({
			id: clip.id,
			video_duration: duration,
		});

		return {
			_account: account,
		};
	}

	head() {
		return (
			meta({
				title: "Upload | Clips",
			}) + style
		);
	}

	body(data: Data<this>) {
		return site({
			path: "/upload",
			account: data._account,
			body: html`
				<h1>Upload clips</h1>
				<p id="progress"></p>
				<input type="file" id="file" multiple accept="video/mp4" style="display: none" />
				<div id="drag">Drag clips here or click to upload</div>
				<script src="/js/clips/upload.js"></script>
			`,
		});
	}
}
