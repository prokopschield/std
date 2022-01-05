export function cacheFn<X, Y>(fn: (x: X) => Y, thisArg?: any): (x: X) => Y {
	const cache = new Map<X, Y>();
	const cfn = (x: X): Y => {
		const cache_val = cache.get(x);
		if (cache_val !== undefined) {
			return cache_val;
		} else {
			const y = fn.call(thisArg, x);
			if (y !== undefined) {
				cache.set(x, y);
			}
			return y;
		}
	};
	return cfn;
}

export default cacheFn;
Object.defineProperties(cacheFn, {
	default: { get: () => cacheFn },
	cacheFn: { get: () => cacheFn },
});
