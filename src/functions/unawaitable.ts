import { delay, ms } from './delay';

export type Unawaitable<T extends object> = Omit<T, 'then'> & { then: never };

/**
 * Wraps an object in a protective coating that prevents .then() recursion.
 * @param argument object to be wrapped
 * @param timeout set a custom timeout
 * @returns the wrapped object
 */
export function unawaitable<T extends object>(
	argument: T,
	timeout: ms = 200
): Unawaitable<T> {
	const value = Object.setPrototypeOf({ then: undefined }, argument);

	delay(timeout).then(() => {
		if (value.then === undefined) {
			delete value.then;
		}
	});

	return value;
}

export default unawaitable;

Object.defineProperties(unawaitable, {
	default: { get: () => unawaitable },
	unawaitable: { get: () => unawaitable },
});
