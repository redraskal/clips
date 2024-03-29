import { html } from "gateway";

export const dateTimeFormat = new Intl.DateTimeFormat("en-US");

export const storagePath = process.env.STORAGE_PATH || "./storage";

export const whitelist = process.env.DISCORD_WHITELIST?.split(",") || [];
export const admins = process.env.DISCORD_ADMINS?.split(",") || [];

export function formatViews(views: number) {
	return html`${views} view${views != 1 ? "s" : ""}`;
}

export function formatDuration(seconds: number) {
	seconds = Math.round(seconds);
	return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function pluralize(n: number, word: string) {
	return `${n} ${word}${n != 1 ? "s" : ""}`;
}
