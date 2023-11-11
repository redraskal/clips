import { MatchedRoute } from "bun";
import { Data, Route } from "gateway";
import { join } from "path";

export default class implements Route {
	data(_: Request, route: MatchedRoute) {
		return {
			path: join(process.env.STORAGE_PATH!, `${route.params.scope}/${route.params.file}`),
		};
	}

	body(data: Data<this>) {
		return new Response(Bun.file(data.path));
	}
}
