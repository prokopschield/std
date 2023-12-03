export function cacheAsyncFn<X, Y>(
	fn: (x: X) => Y | Promise<Y>,
	thisArg?: any
): (x: X) => Promise<Y> {
	const cache = new Map<X, Y | Promise<Y>>();
	const cfn = async (x: X): Promise<Y> => {
		const cache_val = cache.get(x);
		if (cache_val !== undefined) {
			return cache_val;
		} else {
			const promise = fn.call(thisArg, x);

			cache.set(x, promise);

			try {
				const y = await promise;

				if (y !== undefined) {
					cache.set(x, y);
				}

				return y;
			} catch (error) {
				if (cache.get(x) === promise) {
					cache.delete(x);
				}

				throw error;
			}
		}
	};
	return cfn;
}

export default cacheAsyncFn;
Object.defineProperties(cacheAsyncFn, {
	default: { get: () => cacheAsyncFn },
	cacheAsyncFn: { get: () => cacheAsyncFn },
});
