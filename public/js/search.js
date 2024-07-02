const search = document.getElementById("search");

document.addEventListener("keydown", (e) => {
	if (e.key == "/") {
		e.preventDefault();
		search.focus();
	}
});
