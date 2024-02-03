const title = document.querySelector("h1");
const originalTitle = title.textContent;
const description = document.querySelector("p:nth-child(4)");
let changed = false;

function save() {
	if (!changed) return;

	if (title.textContent.length < 1) {
		title.textContent = originalTitle;
		return;
	}

	description.textContent = description.textContent.trim();
	document.title = `${title.textContent} | Clips`;

	fetch("", {
		method: "POST",
		headers: {
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			title: title.textContent,
			description: description.textContent,
		}),
	});
}

title.addEventListener("keydown", (e) => {
	if (e.which == 13) {
		e.preventDefault();
		e.target.blur();
	}
});

title.addEventListener("input", () => {
	changed = true;
});
description.addEventListener("input", () => {
	changed = true;
});

title.addEventListener("blur", save);
description.addEventListener("blur", save);
