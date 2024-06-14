import Future from '../classes/Future';

export type FakePromise<T> = Promise<T> & { value: T };

const TAG = 'FakePromise';

/**
 * Creates a fake promise resolved to `value`.
 * - `value` can be accessed via `.value`
 */
export function asyncFactory<T>(value: T, toStringTag = TAG): FakePromise<T> {
	return {
		then() {
			return Future.resolve(value).then(...arguments);
		},
		catch() {
			return Future.resolve(value).catch(...arguments);
		},
		finally() {
			return Future.resolve(value).finally(...arguments);
		},
		get value() {
			return value;
		},
		[Symbol.toStringTag]: toStringTag,
	};
}

export default asyncFactory;

Object.defineProperties(asyncFactory, {
	default: { get: () => asyncFactory },
	asyncTrap: { get: () => asyncFactory },
});
