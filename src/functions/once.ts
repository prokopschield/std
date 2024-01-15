export function once<T>(fn: () => T, thisArg?: any): () => T {
	let value: T | undefined = undefined;

	const cfn = (): T => {
		if (value === undefined) {
			value = fn.call(thisArg);
		}

		return value;
	};

	return cfn;
}

export default once;

Object.defineProperties(once, {
	default: { get: () => once },
	once: { get: () => once },
});
