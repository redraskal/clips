if (process.env.DATABASE_MIGRATE == "1") {
	import.meta.require("./migrate.ts");
}

console.log("Hello via Bun!");
