/** milliseconds */
export type ms = string | number | BigInt;

/**
 * Wait for (length) milliseconds.
 * @param {number | bigint | string} len Delay length in milliseconds
 */
export async function delay(len: ms) {
	await new Promise((resolve) => setTimeout(resolve, +`${len}` || 0));
}

export default delay;
module.exports = delay;

Object.defineProperties(delay, {
	default: { get: () => delay },
	delay: { get: () => delay },
});
