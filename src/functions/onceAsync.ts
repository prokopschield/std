import { symbol } from './once';

export function onceAsync<T>(
	fn: () => Promise<T>,
	thisArg?: any
): () => Promise<T> {
	let value: T | Promise<T> | typeof symbol = symbol;

	const awaiter = async () => {
		try {
			value = await value;
		} catch {
			value = symbol;
		}
	};

	const cfn = async (): Promise<T> => {
		if (value === symbol) {
			value = fn.call(thisArg);

			setTimeout(awaiter);
		}

		return value as T | Promise<T>;
	};

	return cfn;
}

export default onceAsync;

Object.defineProperties(onceAsync, {
	default: { get: () => onceAsync },
	onceAsync: { get: () => onceAsync },
});
