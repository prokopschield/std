import { asyncFactory, FakePromise } from './asyncFactory';

export type Trappable = object | Function;
export type AsyncTrap<T> = T & FakePromise<T>;

const TAG = 'asyncTrap';

/**
 * Creates a trap for the `await` keyword by wrapping an object in a fake promise.
 * - `value` can be accessed via `.value`
 * - `.then`, `.catch` and `.finally` return a `Future<T>`
 * - property access is propagated to `value` (e.g. `.foo` is equal to `.value.foo`)
 * - property modification does **not** mutate `value`
 * - calling methods on the trap directly is undefined behaviour
 */
export function asyncTrap<T extends Trappable>(
	value: T,
	toStringTag = TAG
): AsyncTrap<T> {
	return Object.setPrototypeOf(asyncFactory(value, toStringTag), value);
}

export default asyncTrap;

Object.defineProperties(asyncTrap, {
	default: { get: () => asyncTrap },
	asyncTrap: { get: () => asyncTrap },
});
