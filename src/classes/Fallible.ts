import { FutureResult } from './Result';

export type Fallible<A extends any[], O = undefined> = (
	...args: A
) => FutureResult<O>;

export function Fallible<A extends any[], O>(
	callback: (..._arguments: A) => O | PromiseLike<O>
): Fallible<A, O> {
	return function Fallible(...args: A) {
		return new FutureResult(() => callback(...args));
	};
}

export default Fallible;

Object.defineProperties(Fallible, {
	default: { get: () => Fallible },
	Fallible: { get: () => Fallible },
});
