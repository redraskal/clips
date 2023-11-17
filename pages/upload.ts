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
		if (req.method == "GET") return { account: inferAccount(req) };
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
			account,
		};
	}

	head() {
		return meta({
			title: "Upload",
		});
	}

	body(data: Data<this>, err?: Error) {
		return site({
			path: "/upload",
			account: data.account,
			body: html`
				<style>
					#drag {
						display: flex;
						justify-content: center;
						align-items: center;
						width: 1000px;
						height: 500px;
						border: 3px dashed white;
						cursor: pointer;
					}
				</style>
				<h1>Upload clips</h1>
				<p id="progress"></p>
				<input type="file" id="file" multiple accept="video/mp4" style="display: none" />
				<div id="drag">Drag clips here or click to upload</div>
				<script>
					const drag = document.getElementById("drag");
					const file = document.getElementById("file");
					const progress = document.getElementById("progress");

					drag.addEventListener("dragover", (e) => e.preventDefault());
					drag.addEventListener("click", () => file.click());
					file.addEventListener("change", async (e) => {
						await upload(e.target.files);
					});
					drag.addEventListener("drop", async (e) => {
						e.preventDefault();
						await upload(e.dataTransfer.files);
					});

					function pushProgress(text) {
						progress.innerText += text;
						progress.innerHTML += "<br />";
					}

					async function upload(files) {
						for (let i = 0; i < files.length; i++) {
							const file = files[i];
							const data = new FormData();
							data.append("file", file, file.name);
							pushProgress("[" + (i + 1) + "/" + files.length + "] Uploading " + file.name + "...");
							await fetch("/upload", {
								method: "POST",
								headers: {
									Accept: "application/json",
								},
								body: data,
							});
						}
						window.location.href = "/";
					}
				</script>
			`,
		});
	}
}
