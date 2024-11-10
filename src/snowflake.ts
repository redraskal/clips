const EPOCH = 1672473600n; // 2023

// TODO: change to Bun.randomUUIDv7() since there can be collisions here at high load
/**
 * Generates a time-based unique id as a BigInt.
 * @returns unique id
 */
export function snowflake() {
	return ((BigInt(Date.now()) - EPOCH) << 22n) | BigInt(Math.floor(Math.random() * 4194304));
}

/**
 * Extracts the time when a snowflake was generated.
 * @param snowflake Snowflake
 * @returns Date
 */
export function snowflakeToDate(snowflake: bigint) {
	return new Date(Number((snowflake >> 22n) + EPOCH));
}
