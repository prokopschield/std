export function onceAsync<T>(
	fn: () => Promise<T>,
	thisArg?: any
): () => Promise<T> {
	let value: T | Promise<T> | undefined = undefined;

	const awaiter = async () => {
		try {
			value = await value;
		} catch {
			value = undefined;
		}
	};

	const cfn = async (): Promise<T> => {
		if (value === undefined) {
			value = fn.call(thisArg);

			setTimeout(awaiter);
		}

		return value;
	};

	return cfn;
}

export default onceAsync;

Object.defineProperties(onceAsync, {
	default: { get: () => onceAsync },
	onceAsync: { get: () => onceAsync },
});
