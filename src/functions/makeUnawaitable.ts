import { delay, ms } from './delay';
import type { Unawaitable } from './unawaitable';

/**
 * Temporarely mutates argument to prevent .then() recursion.
 * @param argument object to be wrapped (will not work on native Promises)
 * @param timeout set a custom timeout
 * @returns the wrapped object
 */
export function makeUnawaitable<T extends object>(
	argument: T,
	timeout: ms = 200
): Unawaitable<T> {
	const current_then = Object.getOwnPropertyDescriptor(argument, 'then');

	Object.defineProperty(argument, 'then', {
		value: undefined,
		enumerable: false,
		configurable: true,
	});

	delay(timeout).then(() => {
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
