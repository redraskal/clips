import type { MatchedRoute } from "bun";
import { Route } from "gateway";
import { selectClip } from ".";

export default class implements Route {
	async data(_: Request, route: MatchedRoute) {
		const data = selectClip.get(route.params.id) as {
			id: string;
			title: string;
			description: string | null;
			uploader_id: string;
			video_duration: number;
			views: number;
			username: string | null;
			discord_id: string | null;
		} | null;

		if (!data || !data.discord_id) throw new Error("Clip not found.");

		return {
			version: "1.0",
			type: "photo",
			provider_name: "Clips",
			provider_url: Bun.env.WEBSITE_ROOT,
			title: data.title,
			author_name: data.username,
			author_url: `${Bun.env.WEBSITE_ROOT}/@${data.username}`,
			width: "1280",
			height: "720",
			url: `${Bun.env.WEBSITE_ROOT}/content/${data.uploader_id}/${data.id}.jpg`,
		};
	}
}
