import { Err, Ok, Result } from '../classes/Result';

export const ITERATOR_EXHAUSTED = Symbol.for('ITERATOR_EXHAUSTED');

export type SyncGenerator<I> = () => I | Result<I>;
export type SyncStepper<I> = (previous: I) => I | Result<I>;
export type SyncIterator<I, O> = (input: I) => O | Result<O>;
export type SyncValidator<O> = (output: O) => boolean | Result<boolean>;

export function iterateSync<I, O>(
	genfn: SyncGenerator<I>,
	iterator: SyncIterator<I, O>,
	validator: SyncValidator<O>
): Result<O>;

export function iterateSync<I, O>(
	iterable: Iterable<I>,
	iterator: SyncIterator<I, O>,
	validator: SyncValidator<O>
): Result<O>;

export function iterateSync<I, O>(
	init: SyncGenerator<I>,
	step: SyncStepper<I>,
	iterator: SyncIterator<I, O>,
	validator: SyncValidator<O>
): Result<O>;

export function iterateSync<I, O>(
	...args:
		| [SyncGenerator<I>, SyncIterator<I, O>, SyncValidator<O>]
		| [Iterable<I>, SyncIterator<I, O>, SyncValidator<O>]
		| [
				SyncGenerator<I>,
				SyncStepper<I>,
				SyncIterator<I, O>,
				SyncValidator<O>
		  ]
): Result<O> {
	if (args.length === 4) {
		return iterateSyncResultWrapper(...args);
	}

	if (Symbol.iterator in args[0]) {
		return iterateSyncIterableWrapper(args[0], args[1], args[2]);
	}

	return iterateSyncResultWrapper(args[0], args[0], args[1], args[2]);
}

export function iterateSyncIterableWrapper<I, O>(
	iterable: Iterable<I>,
	iterator: SyncIterator<I, O>,
	validator: SyncValidator<O>
): Result<O> {
	const reader = iterable[Symbol.iterator]();

	const next = () => {
		const { done, value } = reader.next();

		if (done && value === void 0) {
			throw ITERATOR_EXHAUSTED;
		}

		return value;
	};

	return iterateSyncResultWrapper(next, next, iterator, validator);
}

export function iterateSyncResultWrapper<I, O>(
	init: SyncGenerator<I>,
	step: SyncStepper<I>,
	iterator: SyncIterator<I, O>,
	validator: SyncValidator<O> = () => true
): Result<O> {
	try {
		return Ok(iterateSyncImpl(init, step, iterator, validator));
	} catch (error) {
		return Err(error);
	}
}

export function iterateSyncImpl<I, O>(
	init: SyncGenerator<I>,
	step: SyncStepper<I>,
	iterator: SyncIterator<I, O>,
	validator: SyncValidator<O> = () => true
): O {
	for (
		let input = Result.unwrap(init());
		;
		input = Result.unwrap(step(input))
	) {
		const output = Result.unwrap(iterator(input));
		const valid = Result.unwrap(validator(output));

		if (valid) {
			return output;
		}
	}
}

for (const _ of [
	iterateSync,
	iterateSyncIterableWrapper,
	iterateSyncResultWrapper,
	iterateSyncImpl,
]) {
	Object.defineProperties(_, {
		default: { get: () => iterateSync },
		iterateSync: { get: () => iterateSync },
		iterateSyncIterableWrapper: { get: () => iterateSyncIterableWrapper },
		iterateSyncResultWrapper: { get: () => iterateSyncResultWrapper },
		iterateSyncImpl: { get: () => iterateSyncImpl },
	});
}
