-- Custom SQL migration file, put you code below! --
INSERT INTO accounts_fts (account_id, username)
	SELECT id, username
	FROM accounts;
--> statement-breakpoint
INSERT INTO clips_fts (clip_id, title, description)
	SELECT id, title, description
	FROM clips;
