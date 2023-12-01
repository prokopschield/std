export function cacheAsyncFn<X, Y>(
	fn: (x: X) => Y | Promise<Y>,
	thisArg?: any
): (x: X) => Promise<Y> {
	const cache = new Map<X, Y>();
	const cfn = async (x: X): Promise<Y> => {
		const cache_val = cache.get(x);
		if (cache_val !== undefined) {
			return cache_val;
		} else {
			const y = await fn.call(thisArg, x);
			if (y !== undefined) {
				cache.set(x, y);
			}
			return y;
		}
	};
	return cfn;
}

export default cacheAsyncFn;
Object.defineProperties(cacheAsyncFn, {
	default: { get: () => cacheAsyncFn },
	cacheAsyncFn: { get: () => cacheAsyncFn },
});
