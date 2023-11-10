const EPOCH = 1672473600n; // 2023

export function snowflake() {
	return ((BigInt(Date.now()) - EPOCH) << 22n) | BigInt(Math.floor(Math.random() * 4194304));
}

export function snowflakeToDate(snowflake: bigint) {
	return new Date(Number((snowflake >> 22n) + EPOCH));
}
