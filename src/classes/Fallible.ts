import { FutureResult, Result } from './Result';

export type FallibleSync<A extends any[], O = undefined> = (
	...args: A
) => Result<O>;

export type FallibleAsync<A extends any[], O = undefined> = (
	...args: A
) => FutureResult<O>;

export type Fallible<A extends any[], O = undefined> =
	| FallibleSync<A, O>
	| FallibleAsync<A, O>;

export function FallibleSync<A extends any[], O>(
	callback: (...args: A) => O
): FallibleSync<A, O> {
	const fallible = function Fallible(...args: A): Result<O> {
		return Result.try(() => callback(...args));
	};

	Object.setPrototypeOf(fallible, FallibleSync);

	return fallible;
}

export function FallibleAsync<A extends any[], O>(
	callback: (...args: A) => O | PromiseLike<O>
): FallibleAsync<A, O> {
	const fallible = function Fallible(...args: A): FutureResult<O> {
		return new FutureResult(() => callback(...args));
	};

	Object.setPrototypeOf(fallible, FallibleAsync);

	return fallible;
}

export const Fallible = FallibleAsync;

export default Fallible;

Object.defineProperties(Fallible, {
	default: { get: () => Fallible },
	Fallible: { get: () => Fallible },
	FallibleSync: { get: () => FallibleSync },
	FallibleAsync: { get: () => FallibleAsync },
});
