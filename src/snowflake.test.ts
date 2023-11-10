import { expect, test } from "bun:test";
import { snowflake, snowflakeToDate } from "./snowflake";

test("parsing a snowflake", () => {
	const time = Date.now();
	const id = snowflake();
	expect(snowflakeToDate(id).getTime()).toBeWithin(time - 10, time + 10);
});
