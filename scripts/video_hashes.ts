import { db } from "../src/database";
import { join } from "path";
import { storagePath } from "../src/utils";

const videosWithoutHashes = db
	.prepare<
		{
			id: string;
			uploader_id: string;
		},
		any
	>("select id, uploader_id from clips where hash is null")
	.all();

const updateHash = db.query<
	any,
	{
		id: string;
		hash: number | bigint;
	}
>("update clips set hash=$hash where id=$id");

for (let video of videosWithoutHashes) {
	const path = join(storagePath, `${video.uploader_id}/${video.id}.mp4`);
	const file = Bun.file(path);
	const hash = Bun.hash(await file.arrayBuffer());

	console.log(`${path}: ${hash}`);

	updateHash.run({
		id: video.id,
		hash,
	});
}

console.log(`\nUpdated ${videosWithoutHashes.length} clip(s).`);
