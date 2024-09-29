import { Err, Ok, Result } from '../classes/Result';

export type Async<T> = T | Result<Async<T>> | PromiseLike<Async<T>>;

export function asyncCallback<T>(
	value: Async<T>,
	callback: (value: Result<T>) => any
): void {
	try {
		if (
			value &&
			(typeof value === 'function' || typeof value === 'object')
		) {
			if ('then' in value && typeof value.then === 'function') {
				return void value.then(
					(value) => asyncCallback(value, callback),
					(error) => callback(Err(error))
				);
			}

			const unwrapped = Result.unwrap(value);

			if (unwrapped === value) {
				callback(Ok(value as T));
			} else {
				asyncCallback(unwrapped, callback);
			}
		} else {
			callback(Ok(value as T));
		}
	} catch (error) {
		callback(Err(error));
	}
}

export default asyncCallback;

Object.defineProperties(asyncCallback, {
	default: { get: () => asyncCallback },
	asyncTrap: { get: () => asyncCallback },
});
