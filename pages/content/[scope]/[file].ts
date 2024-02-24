import type { MatchedRoute } from "bun";
import type { Data, Route } from "gateway";
import { join } from "path";

const cacheHeader = {
	"Cache-Control": "max-age=3600",
};

export default class implements Route {
	data(req: Request, route: MatchedRoute) {
		const [_start = 0, _end = Infinity] = req.headers.get("Range")?.split("=").at(-1)?.split("-").map(Number) || [];

		return {
			_start: Math.max(0, _start),
			_end: Math.max(_start + 3e7, _end), // at least a 30MB chunk
			_path: join(process.env.STORAGE_PATH!, `${route.params.scope}/${route.params.file}`),
		};
	}

	body(data: Data<this>) {
		const file = Bun.file(data._path);

		if (file.type.indexOf("video/") != 0) {
			return new Response(file, {
				headers: cacheHeader,
			});
		}

		data._end = Math.min(file.size - 1, data._end);
		const incomplete = data._end < file.size - 1;

		return new Response(file.slice(data._start, data._end), {
			headers: {
				...cacheHeader,
				...{
					"Content-Range": `bytes ${data._start}-${data._end}/${file.size - 1}`,
				},
			},
			status: incomplete ? 206 : undefined,
		});
	}
}
