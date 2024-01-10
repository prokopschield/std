import type { Unawaitable } from './unawaitable';

/**
 * Temporarely mutates argument to prevent .then() recursion.
 * @param argument object to be wrapped (will not work on native Promises)
 * @returns the wrapped object
 */
export function makeUnawaitable<T extends object>(argument: T): Unawaitable<T> {
	const current_then = Object.getOwnPropertyDescriptor(argument, 'then');

	Object.defineProperty(argument, 'then', {
		value: undefined,
		enumerable: false,
		configurable: true,
	});

	setTimeout(() => {
		if (current_then) {
			Object.defineProperty(argument, 'then', current_then);
		} else {
			delete (argument as { then: undefined })['then'];
		}
	});

	return argument as Unawaitable<T>;
}

export default makeUnawaitable;

Object.defineProperties(makeUnawaitable, {
	default: { get: () => makeUnawaitable },
	makeUnawaitable: { get: () => makeUnawaitable },
});
