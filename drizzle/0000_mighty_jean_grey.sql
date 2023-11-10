CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`discord_id` text NOT NULL,
	`discord_avatar_hash` text
);
--> statement-breakpoint
CREATE TABLE `clips` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`uploader_id` text NOT NULL,
	`video_duration` real NOT NULL,
	`video_path` text NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`uploader_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);
