const search = document.getElementById("search");

document.addEventListener("keydown", (e) => {
	if (e.keyCode == 191) {
		e.preventDefault();
		search.focus();
	}
});
