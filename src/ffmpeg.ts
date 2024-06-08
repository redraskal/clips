import { $ } from "bun";

export async function videoDuration(input: string) {
	const output = await $`ffprobe -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${input}`
		.quiet()
		.text();
	return Number(output);
}

export async function generateThumbnail(input: string, at: number, output: string) {
	return await $`ffmpeg -ss ${at.toString()} -i ${input} -frames:v 1 -q:v 2 -vf thumbnail,scale=1280:720,setsar=1 ${output}`.quiet();
}

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
