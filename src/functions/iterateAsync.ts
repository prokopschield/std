import { Future } from '../classes/Future';
import { Result } from '../classes/Result';

export const ITERATOR_EXHAUSTED = Symbol.for('ITERATOR_EXHAUSTED');

type MP<T> = T | PromiseLike<T>;
type MR<T> = T | Result<T>;
type MPP<T> = MP<MP<T> | MR<T>>;
type MRR<T> = MR<MP<T> | MR<T>>;
type MPR<T> = MP<MPP<T> | MRR<T>>;

export type AsyncGenerator<I> = () => MPR<I>;
export type AsyncStepper<I> = (previous: I) => MPR<I>;
export type AsyncIterator<I, O> = (input: I) => MPR<O>;
export type AsyncValidator<O> = (output: O) => MPR<boolean>;

export function iterateAsync<I, O>(
	genfn: AsyncGenerator<I>,
	iterator: AsyncIterator<I, O>,
	validator: AsyncValidator<O>
): Future<O>;

export function iterateAsync<I, O>(
	iterable: Iterable<I>,
	iterator: AsyncIterator<I, O>,
	validator: AsyncValidator<O>
): Future<O>;

export function iterateAsync<I, O>(
	init: AsyncGenerator<I>,
	step: AsyncStepper<I>,
	iterator: AsyncIterator<I, O>,
	validator: AsyncValidator<O>
): Future<O>;

export function iterateAsync<I, O>(
	...args:
		| [AsyncGenerator<I>, AsyncIterator<I, O>, AsyncValidator<O>]
		| [Iterable<I>, AsyncIterator<I, O>, AsyncValidator<O>]
		| [
				AsyncGenerator<I>,
				AsyncStepper<I>,
				AsyncIterator<I, O>,
				AsyncValidator<O>
		  ]
): Future<O> {
	if (args.length === 4) {
		return iterateAsyncResultWrapper(...args);
	}

	if (Symbol.iterator in args[0]) {
		return iterateAsyncIterableWrapper(args[0], args[1], args[2]);
	}

	return iterateAsyncResultWrapper(args[0], args[0], args[1], args[2]);
}

export function iterateAsyncIterableWrapper<I, O>(
	iterable: Iterable<I>,
	iterator: AsyncIterator<I, O>,
	validator: AsyncValidator<O>
): Future<O> {
	const reader = iterable[Symbol.iterator]();

	const next = () => {
		const { done, value } = reader.next();

		if (done && value === void 0) {
			throw ITERATOR_EXHAUSTED;
		}

		return value;
	};

	return iterateAsyncResultWrapper(next, next, iterator, validator);
}

export function iterateAsyncResultWrapper<I, O>(
	init: AsyncGenerator<I>,
	step: AsyncStepper<I>,
	iterator: AsyncIterator<I, O>,
	validator: AsyncValidator<O> = () => true
): Future<O> {
	return new Future((resolve) => {
		return resolve(iterateAsyncImpl(init, step, iterator, validator));
	});
}

export async function unwrap<T>(item: MPR<T>): Promise<T> {
	const transformed = Result.unwrap(await item);

	if (item === transformed) {
		return transformed as T;
	} else {
		return unwrap(transformed);
	}
}

export async function iterateAsyncImpl<I, O>(
	init: AsyncGenerator<I>,
	step: AsyncStepper<I>,
	iterator: AsyncIterator<I, O>,
	validator: AsyncValidator<O> = () => true
): Promise<O> {
	for (
		let input = await unwrap(init());
		;
		input = await unwrap(step(input))
	) {
		const output = await unwrap(iterator(input));
		const valid = await unwrap(validator(output));

		if (valid) {
			return output;
		}
	}
}

for (const _ of [
	iterateAsync,
	iterateAsyncIterableWrapper,
	iterateAsyncResultWrapper,
	iterateAsyncImpl,
	unwrap,
]) {
	Object.defineProperties(_, {
		default: { get: () => iterateAsync },
		iterateAsync: { get: () => iterateAsync },
		iterateAsyncIterableWrapper: { get: () => iterateAsyncIterableWrapper },
		iterateAsyncResultWrapper: { get: () => iterateAsyncResultWrapper },
		iterateAsyncImpl: { get: () => iterateAsyncImpl },
		unwrap: { get: () => unwrap },
	});
}
