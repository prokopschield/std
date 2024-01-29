import asyncFlatMap, {
	Transform,
	AsyncMemberNP,
	PromiseArray,
} from '../functions/asyncFlatMap';
import identity from '../functions/identity';

export interface FutureOptions {
	timeout?: number;
}

export const TIMEOUT = Symbol('FUTURE_TIMEOUT');

export class Future<T> implements Promise<T> {
	value: Awaited<T> | undefined;
	reason: any;
	resolved = false;
	rejected = false;

	callbacks = new Set<(self: this) => any>();

	then<TResult1 = T, TResult2 = never>(
		onfulfilled?:
			| ((value: Awaited<T>) => TResult1 | PromiseLike<TResult1>)
			| null
			| undefined,
		onrejected?:
			| ((reason: any) => TResult2 | PromiseLike<TResult2>)
			| null
			| undefined
	): Future<TResult1 | TResult2> {
		if (this.resolved || this.rejected) {
			setTimeout(() => this.flush());
		}

		return new Future<TResult1 | TResult2>((resolve, reject) => {
			this.callbacks.add((self) => {
				try {
					if (self.rejected) {
						if (onrejected) {
							resolve(onrejected(self.reason));
						} else {
							reject(self.reason);
						}
					} else if (onfulfilled) {
						resolve(onfulfilled(self.value!));
					} else {
						resolve(self.value as any);
					}
				} catch (error) {
					reject(error);
				}
			});
		});
	}

	catch<TResult = never>(
		onrejected?:
			| ((reason: any) => TResult | PromiseLike<TResult>)
			| null
			| undefined
	): Future<Awaited<T> | TResult> {
		return this.then(identity, onrejected);
	}

	finally(
		onfinally?: ((value?: T) => void | Promise<void | T>) | null | undefined
	): Future<T> {
		return this.then(onfinally, onfinally).then(() => this);
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
		) => any | Future<T> | Promise<T>,
		options: FutureOptions = {}
	) {
		if (typeof executor_or_promise === 'function') {
			this.init_with_executor(executor_or_promise);
		} else {
			this.init_with_promise(executor_or_promise);
		}

		if (options.timeout) {
			const timeout = setTimeout(
				() => this.reject(TIMEOUT),
				options.timeout
			);

			this.finally(() => {
				clearTimeout(timeout);
			});
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

	flush() {
		for (const callback of this.callbacks) {
			this.callbacks.delete(callback);
			callback(this);
		}
	}

	protected async resolve(value: T | PromiseLike<T>) {
		try {
			const final = await value;

			this.value = final;
			this.resolved = true;

			this.flush();
		} catch (reason) {
			this.reject(reason);
		}
	}

	protected async reject(reason: any) {
		if (!this.rejected) {
			this.reason = reason;
			this.rejected = true;
		}

		this.flush();
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
					future.callbacks.clear();
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
