import { Lock } from '../classes/Lock';

/**
 * This method decorator ensures calls to this methods are not processed concurrently.
 * @param method This method will be atomically wrapped.
 * @param _ctx This parameter is ignored.
 */
export function atomic<A, R>(
	method: (..._args: A[]) => R,
	_ctx?: ClassMethodDecoratorContext
): (...args: A[]) => Promise<Awaited<R>> {
	const lock = new Lock();

	return async function atomicMethod(
		this: any,
		...args: A[]
	): Promise<Awaited<R>> {
		const guard = await lock.wait_and_lock();

		try {
			return await method.apply(this, args);
		} finally {
			guard.release_async();
		}
	};
}

export default atomic;

Object.defineProperties(atomic, {
	default: { get: () => atomic },
	atomic: { get: () => atomic },
});
