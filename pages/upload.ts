import { Data, Route, html } from "gateway";
import { ensureSignedIn, inferAccount } from "../src/middleware/auth";
import { meta } from "../src/templates/meta";
import { mkdir } from "fs/promises";
import { join, parse } from "path";
import { database } from "../src/database";
import { Clips } from "../src/schema/clips";
import { File } from "buffer";
import { generateThumbnail, videoDuration } from "../src/ffmpeg";
import { eq } from "drizzle-orm";
import { site } from "../src/templates/site";

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

		const root = join(process.env.STORAGE_PATH!, account.id);
		await mkdir(root, { recursive: true });

		const clip = database
			.insert(Clips)
			.values({
				title: parse(file.name).name,
				uploader_id: account.id,
				video_duration: -1,
			})
			.returning()
			.get();

		const path = join(root, `${clip.id}.mp4`);
		await Bun.write(path, file as unknown as Blob);
		const duration = await videoDuration(path);
		await generateThumbnail(path, duration / 2, join(root, `${clip.id}.jpg`));
		database.update(Clips).set({ video_duration: duration }).where(eq(Clips.id, clip.id)).run();

		return {
			_account: account,
		};
	}

	head() {
		return meta({
			title: "Upload",
		});
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
