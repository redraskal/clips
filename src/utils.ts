export const dateTimeFormat = new Intl.DateTimeFormat("en-US");

export const storagePath = process.env.STORAGE_PATH || "./storage";

/** list of discord id's that can join the platform */
export const whitelist = process.env.DISCORD_WHITELIST?.split(",") || [];
/** list of discord id's that are admins */
export const admins = process.env.DISCORD_ADMINS?.split(",") || [];

/**
 * Converts seconds to a mm:ss string format.
 * @param seconds
 * @returns seconds as a formatted string
 */
export function formatDuration(seconds: number) {
	seconds = Math.round(seconds);
	return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * Appends an "s" to a string if n != 1
 * @param n a number
 * @param word word associated with the number
 * @returns formatted string
 */
export function pluralize(n: number, word: string) {
	return `${n} ${word}${n != 1 ? "s" : ""}`;
}
