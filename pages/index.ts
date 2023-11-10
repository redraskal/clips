import { Data, Route, html, formData } from "gateway";

export default class implements Route {
	async data(req: Request) {
		const form = await formData(req);
		return {
			time: new Date(Date.now()).toLocaleString(),
			name: form?.get("name") || "world",
			_secret: "yes",
		};
	}

	head(data: Data<this>) {
		return html`
			<title>Hello ${data.name}!</title>
			<link rel="stylesheet" href="/css/style.css" />
		`;
	}

	body(data: Data<this>) {
		return html`
			<nav>
				<h2>Clips</h2>
				<ul>
					<li>
						<a href="">Home</a>
					</li>
				</ul>
			</nav>
			<main>
				<input type="text" placeholder="Search" />
				<h2>Recently uploaded</h2>
				<h2>From friends</h2>
			</main>
		`;
	}
}
