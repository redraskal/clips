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
	document.title = title.textContent;

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

function shouldFocus() {
	return !document.activeElement.hasAttribute("contenteditable") && document.activeElement.tagName !== "INPUT";
}

title.addEventListener("keydown", (e) => {
	if (e.key == "Enter") {
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

title.addEventListener("focusout", save);
description.addEventListener("focusout", save);

document.addEventListener("keydown", (e) => {
	if ((e.key != "t" && e.key != "d") || !shouldFocus()) return;
	e.preventDefault();

	if (e.key == "t") {
		title.focus();
	} else {
		description.focus();
	}
});
