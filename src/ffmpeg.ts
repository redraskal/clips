export async function videoDuration(input: string) {
	const proc = Bun.spawn([
		"ffprobe",
		"-show_entries",
		"format=duration",
		"-of",
		"default=noprint_wrappers=1:nokey=1",
		input,
	]);
	const stdout = await new Response(proc.stdout).text();
	const stderr = await new Response(proc.stderr).text();

	await proc.exited;

	if (proc.exitCode! > 0) {
		throw new Error(`ffprobe: ${stderr}`);
	}

	return Number(stdout);
}

export async function generateThumbnail(input: string, at: number, output: string) {
	const proc = Bun.spawn([
		"ffmpeg",
		"-ss",
		at.toString(),
		"-i",
		input,
		"-frames:v",
		"1",
		"-q:v",
		"2",
		"-vf",
		"thumbnail,scale=1280:720,setsar=1",
		output,
	]);
	const stderr = await new Response(proc.stderr).text();

	await proc.exited;

	if (proc.exitCode! > 0) {
		throw new Error(`ffmpeg: ${stderr}`);
	}
}

export async function convertToMP4Container(input: Blob, output: string) {
	// return await $`cat ${input} | ffmpeg -i pipe: -c copy -f mp4 pipe: > ${output}`;
	const proc = Bun.spawn(["ffmpeg", "-i", "pipe:", "-c", "copy", output], {
		stdin: input,
	});
	const stderr = await new Response(proc.stderr).text();

	await proc.exited;

	if (proc.exitCode! > 0) {
		throw new Error(`ffmpeg (convert): ${stderr}`);
	}
}
