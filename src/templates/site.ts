import { HTMLTemplateString, html } from "gateway";
import { Accounts } from "../schema/accounts";

type SiteParams = {
	path: string;
	body: HTMLTemplateString;
	account?: typeof Accounts.$inferSelect;
};

export function site(params: SiteParams) {
	return html`
		<nav>
			<h2>Clips</h2>
			<ul>
				<li>
					<a href="/">Home</a>
				</li>
				<li>
					<a href="/upload">Upload</a>
				</li>
			</ul>
			<form action="/search">
				<input type="text" id="search" name="q" placeholder="Search for clips..." required />
			</form>
			<ul>
				<li>${params.account ? html`<a href="/logout">Logout</a>` : html`<a href="/login">Login</a>`}</li>
			</ul>
		</nav>
		<main>${params.body}</main>
		<script src="/js/search.js"></script>
	`;
}
