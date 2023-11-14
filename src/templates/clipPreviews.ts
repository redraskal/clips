import { html } from "gateway";
import { formatDuration, formatViews } from "../utils";
import { snowflakeToDate } from "../snowflake";

const dateTimeFormat = new Intl.DateTimeFormat("en-US");

export function clipPreviews(
	clips: {
		id: string;
		uploader_id: string;
		username: string | null;
		title: string;
		video_duration: number;
		views: number;
	}[]
) {
	// prettier-ignore
	return html`
		<ul class="clips">
		${clips.map(
			(clip) => html`
				<li>
					<div onclick="watch('${clip.id}')">
						<video src="/content/${clip.uploader_id}/${clip.id}.mp4" poster="/content/${clip.uploader_id}/${clip.id}.jpg" muted loop preload="none" onmouseover="this.play()" onmouseout="this.pause()"></video>
						<span>${formatDuration(clip.video_duration)}</span>
						<span>${formatViews(clip.views)}</span>
						<span>${dateTimeFormat.format(snowflakeToDate(BigInt(clip.id)))}</span>
					</div>
					<b>${clip.title}</b>
					<p>${clip.username}</p>
				</li>
			`
		)}
		</ul>
	`;
}
