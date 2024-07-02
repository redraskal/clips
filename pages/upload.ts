import { type Data, Route, cache, html, meta } from "gateway";
import { ensureSignedIn, inferAccount } from "../src/middleware/auth";
import { mkdir } from "fs/promises";
import { join, parse } from "path";
import { db } from "../src/database";
import { File } from "buffer";
import { convertToMP4Container, generateThumbnail, videoDuration } from "../src/ffmpeg";
import { site } from "../src/templates/site";
import { style } from "../src/templates/style";
import { snowflake } from "../src/snowflake";
import { storagePath } from "../src/utils";

const insertClip = db.query(`
	insert into clips (id, title, uploader_id, video_duration)
	values ($id, $title, $uploader_id, -1)
`);
const updateClipDuration = db.query("update clips set video_duration=$video_duration where id=$id");

@cache("head")
export default class implements Route {
	@ensureSignedIn()
	async data(req: Request) {
		if (req.method == "GET") return { _account: inferAccount(req) };
		if (req.method != "POST") return {};

		const account = inferAccount(req)!;
		const formData = await req.formData();
		// @ts-ignore - File type is stupid and broken
		const file = formData.get("file") as File;

		if (!file) throw new Error("No files specified.");
		if (file.type != "video/mp4" && file.type != "video/x-matroska") {
			throw new Error("Only mp4 & mkv files are supported.");
		}

		const root = join(storagePath, account.id);
		await mkdir(root, { recursive: true });

		const id = snowflake().toString();

		insertClip.run({
			id: id,
			title: parse(file.name).name,
			uploader_id: account.id,
		});

		const path = join(root, `${id}.mp4`);

		if (file.type == "video/mp4") {
			await Bun.write(path, file as unknown as Blob);
		} else {
			await convertToMP4Container(file as unknown as Blob, path);
		}

		const duration = await videoDuration(path);
		await generateThumbnail(path, duration / 2, join(root, `${id}.jpg`));

		updateClipDuration.run({
			id: id,
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
				<input type="file" id="file" multiple accept="video/mp4,video/x-matroska" style="display: none" />
				<div id="drag">Drag clips here or click to upload</div>
				<script src="/js/clips/upload.js"></script>
			`,
		});
	}
}
