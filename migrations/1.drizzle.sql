CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`discord_id` text NOT NULL,
	`discord_avatar_hash` text
);

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

CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action
);

CREATE UNIQUE INDEX `accounts_discord_id_unique` ON `accounts` (`discord_id`);

ALTER TABLE `clips` DROP COLUMN `video_path`;

CREATE VIRTUAL TABLE clips_fts USING fts5(clip_id, title, description, tokenize='trigram');

CREATE TRIGGER clips_fts_insert AFTER INSERT on clips BEGIN
	INSERT INTO clips_fts (clip_id, title, description) VALUES (new.id, new.title, new.description);
END;

CREATE TRIGGER clips_fts_update AFTER UPDATE on clips BEGIN
	DELETE FROM clips_fts WHERE clip_id = old.id;
	INSERT INTO clips_fts (clip_id, title, description) VALUES (new.id, new.title, new.description);
END;

CREATE TRIGGER clips_fts_delete AFTER DELETE on clips BEGIN
	DELETE FROM clips_fts WHERE clip_id = old.id;
END;

CREATE VIRTUAL TABLE accounts_fts USING fts5(account_id, username, tokenize='trigram');

CREATE TRIGGER accounts_fts_insert AFTER INSERT on accounts BEGIN
	INSERT INTO accounts_fts (account_id, username) VALUES (new.id, new.username);
END;

CREATE TRIGGER accounts_fts_update AFTER UPDATE on accounts BEGIN
	DELETE FROM accounts_fts WHERE account_id = old.id;
	INSERT INTO accounts_fts (account_id, username) VALUES (new.id, new.username);
END;

CREATE TRIGGER accounts_fts_delete AFTER DELETE on accounts BEGIN
	DELETE FROM accounts_fts WHERE account_id = old.id;
END;

INSERT INTO accounts_fts (account_id, username)
	SELECT id, username
	FROM accounts;

INSERT INTO clips_fts (clip_id, title, description)
	SELECT id, title, description
	FROM clips;
