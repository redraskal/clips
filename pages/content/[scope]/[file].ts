import type { MatchedRoute } from "bun";
import type { Data, Route } from "gateway";
import { join } from "path";
import { storagePath } from "../../../src/utils";

const cacheHeader = {
	"Cache-Control": "max-age=3600",
};

export default class implements Route {
	async data(req: Request, route: MatchedRoute) {
		const path = join(storagePath, `${route.params.scope}/${route.params.file}`);
		const file = Bun.file(path);
		const [_start = 0, _end = Infinity] = req.headers.get("Range")?.split("=").at(-1)?.split("-").map(Number) || [];

		if (!(await file.exists())) {
			throw new Error("Content does not exist.");
		}

		return {
			_start: Math.max(0, _start),
			_end: Math.min(file.size - 1, Math.max(_start + 3e7, _end)), // at least a 30MB chunk
			_path: path,
			_file: file,
		};
	}

	body(data: Data<this>) {
		if (data._file.type.indexOf("video/") != 0) {
			return new Response(data._file, {
				headers: cacheHeader,
			});
		}

		return new Response(data._file.slice(data._start, data._end + 1), {
			headers: {
				...cacheHeader,
				...{
					"Content-Range": `bytes ${data._start}-${data._end}/${data._file.size}`,
				},
			},
			status: 206,
		});
	}
}
