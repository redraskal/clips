import { html } from "gateway";

type MetaParams = {
	title: string;
	description?: string;
	image?: string;
	video?: string;
};

export function meta(params: MetaParams) {
	const title = `${params.title} | Clips`;
	const description = params.description || "";
	const image = params.image || "";

	return html`
		<meta name="theme-color" content="#000000" />
		<title>${title}</title>
		<meta name="title" content="${title}" />
		<meta name="description" content="${description}" />
		${params.video
			? html`
					<meta property="og:type" content="video.movie" />
					<meta property="og:video" content="${params.video}" />
					<meta property="og:video:secure_url" content="${params.video}" />
					<meta property="og:video:type" content="video/mp4" />
					<meta property="og:video:width" content="1280" />
					<meta property="og:video:height" content="720" />
			  `
			: html` <meta property="og:type" content="website" /> `}
		<meta property="og:title" content="${title}" />
		<meta property="og:description" content="${description}" />
		<meta property="og:image" content="${image}" />
		<meta property="twitter:card" content="summary_large_image" />
		<meta property="twitter:title" content="${title}" />
		<meta property="twitter:description" content="${description}" />
		<meta property="twitter:image" content="${image}" />
		<link rel="stylesheet" href="/css/style.css" />
	`;
}
