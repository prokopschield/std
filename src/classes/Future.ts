import asyncFlatMap, {
	Transform,
	AsyncMemberNP,
	PromiseArray,
} from '../functions/asyncFlatMap';
import identity from '../functions/identity';

export class Future<T> implements Promise<T> {
	value: T | Future<T> = this;
	reason: any = undefined;
	resolved = false;
	rejected = false;

	callbacks_then: Set<(arg: Awaited<T>) => any> = new Set();
	callbacks_catch: Set<(reason: any) => any> = new Set();

	async then<TResult1 = T, TResult2 = never>(
		onfulfilled?:
			| ((value: Awaited<T>) => TResult1 | PromiseLike<TResult1>)
			| null
			| undefined,
		onrejected?:
			| ((reason: any) => TResult2 | PromiseLike<TResult2>)
			| null
			| undefined
	): Promise<TResult1 | TResult2> {
		if (onfulfilled && this.value !== this) {
			return onfulfilled(await this.value);
		}

		if (onrejected && this.rejected) {
			return onrejected(this.reason);
		}

		const promise_then =
			typeof onfulfilled === 'function'
				? new Future<TResult1>((resolve, reject) => {
						const cleanup = () => {
							this.callbacks_then.delete(happy);
							this.callbacks_catch.delete(sad);
						};

						const happy = (arg: Awaited<T>) => {
							cleanup();
							resolve(onfulfilled(arg));
						};

						const sad = (reason: any) => {
							cleanup();

							if (typeof onrejected !== 'function') {
								reject(reason);
							}
						};

						this.callbacks_then.add(happy);
						this.callbacks_catch.add(sad);
				  })
				: onfulfilled;

		const promise_catch =
			typeof onrejected === 'function'
				? new Future<T | TResult2>((resolve) => {
						const cleanup = () => {
							this.callbacks_then.delete(happy);
							this.callbacks_catch.delete(sad);
						};

						const happy = (_arg: T) => {
							cleanup();

							if (typeof onfulfilled !== 'function') {
								resolve(this);
							}
						};

						const sad = (reason: any) => {
							cleanup();
							resolve(reason);
						};

						this.callbacks_then.add(happy);
						this.callbacks_catch.add(sad);
				  })
				: onrejected;

		const promises: Array<typeof promise_then | typeof promise_catch> = [];

		promise_then && promises.push(promise_then);
		promise_catch && promises.push(promise_catch);

		const raced = await Promise.race(promises);

		return raced || promise_then || promise_catch || (this as any);
	}

	async catch<TResult = never>(
		onrejected?:
			| ((reason: any) => TResult | PromiseLike<TResult>)
			| null
			| undefined
	): Promise<T | TResult> {
		if (this.resolved) {
			return this.value;
		}

		if (onrejected && this.rejected) {
			return onrejected(this.reason);
		}

		return new Promise<T | TResult>((resolve) => {
			if (onrejected) {
				const cleanup = () => {
					this.callbacks_then.delete(happy);
					this.callbacks_catch.delete(sad);
				};

				const happy = (value: T) => {
					cleanup();
					resolve(value);
				};

				const sad = (reason: any) => {
					cleanup();
					resolve(onrejected(reason));
				};

				this.callbacks_then.add(happy);
				this.callbacks_catch.add(sad);
			} else {
				return this;
			}
		});
	}

	async finally(
		onfinally?: ((value?: T) => void | Promise<void | T>) | null | undefined
	): Promise<T> {
		return this.then(
			async (value) => {
				await onfinally?.(value);

				return value;
			},
			() => {
				onfinally?.();

				return this;
			}
		);
	}

	async asyncFlatMap<R>(
		transform: Transform<T[keyof T & number], AsyncMemberNP<Awaited<R>>>
	): Promise<AsyncMemberNP<Awaited<R>>[]> {
		const value = await this;

		return await asyncFlatMap(
			Symbol.iterator in value
				? (value as unknown as T[keyof T & number][])
				: [value as unknown as T[keyof T & number]],
			transform
		);
	}

	[Symbol.toStringTag] = 'Future';

	constructor(
		executor_or_promise: (
			resolve: (value: T | PromiseLike<T>) => void,
			reject: (reason?: any) => void
		) => any | Future<T> | Promise<T>
	) {
		if (typeof executor_or_promise === 'function') {
			this.init_with_executor(executor_or_promise);
		} else {
			this.init_with_promise(executor_or_promise);
		}
	}

	protected async init_with_executor(
		executor: (
			resolve: (value: T | PromiseLike<T>) => void,
			reject: (reason?: any) => void
		) => any
	) {
		try {
			await executor(
				(value) => this.resolve(value),
				(reason) => this.reject(reason)
			);
		} catch (error) {
			this.reject(error);
		}
	}

	protected async init_with_promise(promise: Future<T> | Promise<T>) {
		try {
			this.resolve(await promise);
		} catch (reason) {
			this.reject(reason);
		}
	}

	protected async resolve(value: T | PromiseLike<T>) {
		try {
			const final = await value;

			this.value = final;
			this.resolved = true;

			this.callbacks_catch.clear();

			await Promise.all(
				[...this.callbacks_then].map(async (callback) => {
					this.callbacks_then.delete(callback);
					await callback(final);
				})
			);
		} catch (reason) {
			this.reject(reason);
		}
	}

	protected resolve_once(value: T | PromiseLike<T>) {
		if (this.value === this) {
			this.resolve((this.value = Future.resolve(value)));
		}
	}

	protected async reject(reason: any) {
		if (!this.rejected) {
			this.reason = reason;
			this.rejected = true;
		}

		this.callbacks_then.clear();

		try {
			await Promise.all(
				[...this.callbacks_catch].map(async (callback) => {
					this.callbacks_catch.delete(callback);
					await callback(reason);
				})
			);
		} catch (error) {
			this.reject(error);
		}
	}

	static resolve<T>(value: T | PromiseLike<T>) {
		return new Future<T>((resolve) => resolve(value));
	}

	static reject<T>(reason: any) {
		return new Future<T>((_, reject) => reject(reason));
	}

	static all<T>(...items: Array<PromiseArray<T>>): Future<T[]> {
		return Future.resolve<T[]>(
			asyncFlatMap(items, (items) => asyncFlatMap(items, identity))
		);
	}

	static race<T>(items: Array<T | PromiseLike<T>>): Future<T> {
		return new Future<T>((resolve) => {
			const futures = items.map((item) => Future.resolve(item));

			const resolver = (item: T) => {
				for (const future of futures) {
					future.callbacks_then.delete(resolver);
				}

				resolve(item);
			};

			futures.map((item) => item.then(resolver));
		});
	}
}

export default Future;

Object.defineProperties(Future, {
	default: { get: () => Future },
	Future: { get: () => Future },
});
