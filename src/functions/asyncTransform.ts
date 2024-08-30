import Future from '../classes/Future';

export function asyncTransform<I, O>(
	value: I | PromiseLike<I>,
	transform: (value: I) => O | PromiseLike<O>
): Future<O> {
	try {
		if (
			typeof value === 'object' &&
			value &&
			'then' in value &&
			typeof value.then === 'function'
		) {
			return new Future<O>((resolve, reject) => {
				value.then(transform).then(resolve, reject);
			});
		}

		return Future.resolve(transform(value as I));
	} catch (error) {
		return Future.reject(error);
	}
}

export default asyncTransform;

Object.defineProperties(asyncTransform, {
	default: { get: () => asyncTransform },
	asyncTransform: { get: () => asyncTransform },
});
