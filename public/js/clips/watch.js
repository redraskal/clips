const video = document.querySelector("video");
const timeParam = Number(new URL(location.href).searchParams.get("t") || 0);
let seeked = false;

if (timeParam > 0) {
	video.pause();
	video.currentTime = timeParam;
	video.play();
}

video.addEventListener("seeked", () => {
	if (video.currentTime == 0 || video.currentTime == timeParam) return;

	const url = new URL(location.href);
	seeked = true;

	url.searchParams.set("t", video.currentTime.toFixed(2));
	history.pushState(null, document.title, url);
});

video.loop = false;

video.addEventListener("ended", () => {
	if (!seeked && timeParam > 0) {
		video.currentTime = timeParam;
	}
	video.play();
});
