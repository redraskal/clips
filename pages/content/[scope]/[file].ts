import { MatchedRoute } from "bun";
import { Data, Route } from "gateway";
import { join } from "path";

export default class implements Route {
	data(_: Request, route: MatchedRoute) {
		return {
			_path: join(process.env.STORAGE_PATH!, `${route.params.scope}/${route.params.file}`),
		};
	}

	body(data: Data<this>) {
		return new Response(Bun.file(data._path).stream(), {
			headers: {
				"Cache-Control": "max-age=3600",
			},
		});
	}
}
