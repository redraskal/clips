import Database from "bun:sqlite";

const db = new Database(process.env.DATABASE || "clips.sqlite", {
	safeIntegers: true,
	strict: true,
});

db.exec("pragma journal_mode = WAL;");
db.exec("pragma synchronous = normal;");
db.exec("pragma temp_store = memory;");
db.exec("pragma mmap_size = 30000000000;");

export { db };
