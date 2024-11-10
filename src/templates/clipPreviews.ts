import { html } from "gateway";
import { dateTimeFormat, formatDuration, pluralize } from "../utils";
import { snowflakeToDate } from "../snowflake";

export type ClipPreview = {
	id: string;
	uploader_id: string;
	username: string | null;
	title: string;
	video_duration: number;
	views: number;
};

export function clipPreviews(clips: ClipPreview[]) {
	return html`
		<ul class="clips">
			${clips.map(({ id, title, uploader_id, video_duration, views, username }) => {
				const durationAsString = formatDuration(video_duration);
				const viewsAsString = pluralize(views, "view");
				const uploadedAt = dateTimeFormat.format(snowflakeToDate(BigInt(id)));
				const contentRoot = `/content/${uploader_id}/${id}`;

				return html`
					<li>
						<a href="/watch/${id}">
							<video
								src="${contentRoot}.mp4"
								poster="${contentRoot}.jpg"
								muted
								loop
								preload="none"
								onmouseover="this.play()"
								onmouseout="this.pause()"
							></video>
							<span>${durationAsString}</span>
							<span>${viewsAsString}</span>
							<span>${uploadedAt}</span>
						</a>
						<b>${title}</b>
						<p><a href="/@${username}">${username}</a></p>
					</li>
				`;
			})}
		</ul>
	`;
}
