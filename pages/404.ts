import { Route, cache, html, meta } from "gateway";
import { style } from "../src/templates/style";

@cache()
export default class implements Route {
	head() {
		return (
			meta({
				title: "404 | Clips",
				description: "Page not found",
			}) + style
		);
	}

	body() {
		return html`
			<h1>Page not found</h1>
			<p>Sorry, we can't find that page.</p>
			<a href="/">
				<button>Back to Home</button>
			</a>
		`;
	}
}
