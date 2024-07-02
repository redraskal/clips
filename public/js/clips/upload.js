const drag = document.getElementById("drag");
const file = document.getElementById("file");
const progress = document.getElementById("progress");

drag.addEventListener("dragover", (e) => e.preventDefault());
drag.addEventListener("click", () => file.click());
drag.addEventListener("drop", async (e) => {
	e.preventDefault();
	await upload(e.dataTransfer.files);
});

file.addEventListener("change", async (e) => {
	await upload(e.target.files);
});

function pushProgress(text) {
	progress.innerText += text;
	progress.innerHTML += "<br />";
}

async function upload(files) {
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const data = new FormData();

		data.append("file", file, file.name);

		pushProgress("[" + (i + 1) + "/" + files.length + "] Uploading " + file.name + "...");

		await fetch("/upload", {
			method: "POST",
			headers: {
				Accept: "application/json",
			},
			body: data,
		});
	}
	window.location.href = "/";
}
