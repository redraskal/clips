import { html } from "gateway";
import type { CachedAccount } from "../middleware/auth";

type SiteParams = {
	path: string;
	body: string;
	account?: CachedAccount;
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
				<input
					type="text"
					id="search"
					name="q"
					placeholder="Search for clips..."
					minlength="3"
					maxlength="100"
					required
				/>
			</form>
			<ul>
				<li><a href="/${params.account ? "logout" : "login"}">${params.account ? "Logout" : "Login"}</a></li>
			</ul>
		</nav>
		<main>${params.body}</main>
		<script src="/js/search.js"></script>
	`;
}
