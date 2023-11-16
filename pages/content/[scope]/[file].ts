import { MatchedRoute } from "bun";
import { Data, Route } from "gateway";
import { join } from "path";

export default class implements Route {
	data(req: Request, route: MatchedRoute) {
		const [_start, _end] = req.headers.get("Range")?.split("=")?.at(-1)?.split("-").map(Number) || [0, Infinity];

		return {
			_path: join(process.env.STORAGE_PATH!, `${route.params.scope}/${route.params.file}`),
			_start: Math.max(0, _start),
			_end: _end <= 0 ? Infinity : _end,
		};
	}

	body(data: Data<this>) {
		return new Response(Bun.file(data._path).slice(data._start, data._end), {
			headers: {
				"Cache-Control": "max-age=3600",
			},
		});
	}
}
