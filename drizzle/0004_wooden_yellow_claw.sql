-- Custom SQL migration file, put you code below! --
CREATE VIRTUAL TABLE clips_fts USING fts5(clip_id, title, description, tokenize='trigram');
--> statement-breakpoint
CREATE TRIGGER clips_fts_insert AFTER INSERT on clips BEGIN
	INSERT INTO clips_fts (clip_id, title, description) VALUES (new.id, new.title, new.description);
END;
--> statement-breakpoint
CREATE TRIGGER clips_fts_update AFTER UPDATE on clips BEGIN
	DELETE FROM clips_fts WHERE clip_id = old.id;
	INSERT INTO clips_fts (clip_id, title, description) VALUES (new.id, new.title, new.description);
END;
--> statement-breakpoint
CREATE TRIGGER clips_fts_delete AFTER DELETE on clips BEGIN
	DELETE FROM clips_fts WHERE clip_id = old.id;
END;
--> statement-breakpoint
CREATE VIRTUAL TABLE accounts_fts USING fts5(account_id, username, tokenize='trigram');
--> statement-breakpoint
CREATE TRIGGER accounts_fts_insert AFTER INSERT on accounts BEGIN
	INSERT INTO accounts_fts (account_id, username) VALUES (new.id, new.username);
END;
--> statement-breakpoint
CREATE TRIGGER accounts_fts_update AFTER UPDATE on accounts BEGIN
	DELETE FROM accounts_fts WHERE account_id = old.id;
	INSERT INTO accounts_fts (account_id, username) VALUES (new.id, new.username);
END;
--> statement-breakpoint
CREATE TRIGGER accounts_fts_delete AFTER DELETE on accounts BEGIN
	DELETE FROM accounts_fts WHERE account_id = old.id;
END;
