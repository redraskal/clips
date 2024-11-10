const authorization = `Basic ${btoa(`${process.env.DISCORD_CLIENT_ID}:${process.env.DISCORD_CLIENT_SECRET}`)}`;

export async function fetchDiscordUser(code: string) {
	const token = await fetch("https://discord.com/api/oauth2/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: authorization,
		},
		body: new URLSearchParams({
			grant_type: "authorization_code",
			code,
			redirect_uri: process.env.DISCORD_REDIRECT_URI,
		}),
	}).then((res) => res.json() as { access_token?: string });

	if (!token.access_token) {
		return;
	}

	const me = await fetch("https://discord.com/api/oauth2/@me", {
		headers: {
			Authorization: `Bearer ${token.access_token}`,
		},
	}).then(
		(res) =>
			res.json() as {
				user?: {
					id: string;
					username: string;
					avatar: string;
				};
			}
	);

	if (!me.user) {
		return;
	}

	return me.user;
}
