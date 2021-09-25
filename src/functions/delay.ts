/** milliseconds */
export type ms = string | number | bigint;

/**
 * Wait for (length) milliseconds.
 * @param {number | bigint | string} len Delay length in milliseconds
 */
export async function delay(len: ms) {
	await new Promise((resolve) => setTimeout(resolve, +`${len}` || 0));
}

export default delay;

Object.defineProperties(delay, {
	default: { get: () => delay },
	delay: { get: () => delay },
});
