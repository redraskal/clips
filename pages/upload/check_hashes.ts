import { type Route } from "gateway";
import { db } from "../../src/database";
import { z } from "zod";

const queryClipHash = db.query<bigint | number, [bigint | number]>("select hash from clips where hash=?");
const requestSchema = z.array(z.string().transform((str) => BigInt(str)));

export default class implements Route {
	async data(req: Request) {
		const data = await req.json();
		const hashes = requestSchema.parse(data);
		const hits = [];

		if (!hashes) {
			throw new Error("You must provide an array of hashes.");
		}

		for (const hash of hashes) {
			if (queryClipHash.values(hash).length > 0) {
				hits.push(hash.toString());
			}
		}

		return hits;
	}
}
