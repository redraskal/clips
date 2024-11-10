import { $ } from "bun";

/**
 * Retrieves a video's duration using ffprobe.
 * @param input Video file path
 * @returns video duration, in seconds
 */
export async function videoDuration(input: string) {
	const output = await $`ffprobe -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${input}`
		.quiet()
		.text();
	return Number(output);
}

/**
 * Generates & saves a thumbnail (1280x720) using ffmpeg.
 * @param input Input video file path
 * @param at Timestamp in seconds to capture the thumbnail at
 * @param output Output image file path
 */
export async function generateThumbnail(input: string, at: number, output: string) {
	return await $`ffmpeg -ss ${at.toString()} -i ${input} -frames:v 1 -q:v 2 -vf thumbnail,scale=1280:720,setsar=1 ${output}`.quiet();
}

/**
 * Converts a video to an mp4 container (for web playback) using ffmpeg.
 * @param input Input video Blob
 * @param output Output video file path
 */
export async function convertToMP4Container(input: Blob, output: string) {
	// TODO: use bun shell, but that does not work right now
	const proc = Bun.spawn(["ffmpeg", "-i", "pipe:", "-c", "copy", output], {
		stdin: input,
	});
	const stderr = await new Response(proc.stderr).text();

	await proc.exited;

	if (proc.exitCode! > 0) {
		throw new Error(`ffmpeg (convert): ${stderr}`);
	}
}
