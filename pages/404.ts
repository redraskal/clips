import { Route, html } from "gateway";
import { meta } from "../src/templates/meta";

export default class implements Route {
	head() {
		return meta({
			title: "404",
			description: "Page not found",
		});
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
