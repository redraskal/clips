declare module "bun" {
	interface Env {
		DATABASE?: string;
		DATABASE_MIGRATE?: string;
		DISCORD_ADMINS?: string;
		DISCORD_CLIENT_ID: string;
		DISCORD_CLIENT_SECRET: string;
		DISCORD_REDIRECT_URI: string;
		DISCORD_WHITELIST?: string;
		WEBSITE_ROOT?: string;
		STORAGE_PATH?: string;
	}
}
