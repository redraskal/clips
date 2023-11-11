import { HTMLTemplateString, html } from "gateway";

export function site(path: string, body: HTMLTemplateString) {
	return html`
		<nav>
			<h2>Clips</h2>
			<ul>
				<li>
					<a href="/">Home</a>
				</li>
			</ul>
		</nav>
		<main>${body}</main>
	`;
}
