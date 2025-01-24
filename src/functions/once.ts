export const symbol = Symbol.for('一度');

export function once<T>(fn: () => T, thisArg?: any): () => T {
	let value: T | typeof symbol = symbol;

	const cfn = (): T => {
		if (value === symbol) {
			value = fn.call(thisArg);
		}

		return value as T;
	};

	return cfn;
}

export default once;

Object.defineProperties(once, {
	default: { get: () => once },
	once: { get: () => once },
});
