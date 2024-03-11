import Future from './Future';
import Lock from './Lock';

export interface Transform<I, O> {
	(input: I): O | PromiseLike<O>;
}

export interface PipelineFn<I, O> extends Transform<I, O> {
	(input: I | PromiseLike<I>): Future<O>;
}

export interface Pipeline<I, O> extends PipelineFn<I, O> {
	pipe<T>(transform: Transform<O, T>, lock?: Lock): Pipeline<I, T>;
}

export function pipe<A, B, C>(
	this: PipelineFn<A, B>,
	transform: Transform<B, C>,
	lock = new Lock()
): Pipeline<A, C> {
	const previous = this;

	const pipeline: Pipeline<A, C> = Object.assign(
		function Pipeline(input: A | PromiseLike<A>) {
			const guard_promise = lock.wait_and_lock();

			const future = new Future<C>((resolve, reject) => {
				Future.resolve<A>(input)
					.then(previous)
					.await(guard_promise)
					.then(transform)
					.then(resolve, reject)
					.then(() => guard_promise)
					.then((guard) => guard.release_async());
			});

			return future;
		},
		{ pipe }
	);

	return pipeline;
}

export function Pipeline<I, O>(
	transform: Transform<I, O>,
	lock = new Lock()
): Pipeline<I, O> {
	// @ts-ignore
	return pipe(transform, lock);
}

export default Pipeline;

Object.defineProperties(Pipeline, {
	pipe: { get: () => pipe },
	default: { get: () => Pipeline },
	Pipeline: { get: () => Pipeline },
});
