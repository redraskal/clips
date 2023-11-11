import { MatchedRoute } from "bun";
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
	async data(req: Request, route: MatchedRoute) {
		if (req.method != "POST") return;

		const user = inferAccount(req)!;
		const formData = await req.formData();
		const files = (formData.getAll("files") as File[]).filter((file) => file.type == "video/mp4");

		if (!files) throw new Error("No files specified.");
		if (files.length == 0) throw new Error("Only mp4 files are supported.");

		const root = join(process.env.STORAGE_PATH!, user.id);
		await mkdir(root, { recursive: true });

		const clips = database
			.insert(Clips)
			.values(
				files.map((file) => {
					return {
						title: parse(file.name).name,
						uploader_id: user.id,
						video_duration: -1,
					};
				})
			)
			.returning()
			.all();

		for (let i = 0; i < files.length; i++) {
			const path = join(root, `${clips[i].id}.mp4`);
			await Bun.write(path, files[i] as unknown as Blob);
			const duration = await videoDuration(path);
			await generateThumbnail(path, duration / 2, join(root, `${clips[i].id}.jpg`));
			database.update(Clips).set({ video_duration: duration }).where(eq(Clips.id, clips[i].id)).run();
		}

		return {};
	}

	head() {
		return meta({
			title: "Upload",
		});
	}

	body(data: Data<this>, err?: Error) {
		return site(
			"/upload",
			html`
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
				<input type="file" id="file" multiple accept="video/mp4" hidden />
				<div id="drag">Drag clips here or click to upload</div>
				<button>Done</button>
				<script>
					const drag = document.getElementById("drag");
					const file = document.getElementById("file");

					drag.addEventListener("dragover", (e) => e.preventDefault());
					drag.addEventListener("click", () => file.click());
					file.addEventListener("change", (e) => {
						upload(e.target.files);
					});
					drag.addEventListener("drop", (e) => {
						e.preventDefault();
						upload(e.dataTransfer.files);
					});

					function upload(files) {
						const data = new FormData();
						for (const file of files) {
							data.append("files", file, file.name);
						}
						fetch("/upload", {
							method: "POST",
							headers: {
								Accept: "application/json",
								"Content-Type": "multipart/form-data",
							},
							body: data,
						}).then(() => alert("Uploaded!"));
					}
				</script>
			`
		);
	}
}
