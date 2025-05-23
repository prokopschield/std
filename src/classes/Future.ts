import asyncFlatMap, {
	Transform,
	AsyncMemberNP,
	PromiseArray,
} from '../functions/asyncFlatMap';
import identity from '../functions/identity';
import noop from '../functions/noop';
import once from '../functions/once';

export interface FutureOptions<T> {
	/** Should the executor only be called when this Future is awaited? */
	lazy?: boolean;
	/** how often .poll() is called */
	interval?: number;
	/** @returns a value which resolves this Future, or undefined */
	poll?: () => undefined | PromiseLike<T | undefined>;
	timeout?: number;
}

export const TIMEOUT = Symbol('FUTURE_TIMEOUT');

export type Executor<T> = (
	resolve: (value: T | PromiseLike<T>) => void,
	reject: (reason?: any) => void
) => any;

export const VoidExecutor: Executor<void> = (resolve) => resolve();

export type ErrorHandler = (_error: unknown) => any;
export type FutureCallback<T> = (_value: Awaited<T>) => any;
export type Then<T> = (_cb: FutureCallback<T>, _err: ErrorHandler) => any;
export type Thennable<T> = { then: Then<T> };

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
						resolve(self.value as TResult1);
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

	await<X>(
		executor_or_promise: Executor<X> | PromiseLike<X> | null | undefined
	): Future<T> {
		const awaiter = new Future<X | void>(
			executor_or_promise || VoidExecutor
		);

		return awaiter.then(() => this);
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
		executor_or_promise: Executor<T> | PromiseLike<T>,
		options: FutureOptions<T> = {}
	) {
		if (options.lazy) {
			return new LazyFuture(executor_or_promise, options);
		}

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

		if (options.poll) {
			this._poll = options.poll;
		}

		if (options.interval) {
			this._interval = options.interval;
		}

		if (options.poll && options.interval) {
			this.schedule_poll();
		}
	}

	protected async init_with_executor(executor: Executor<T>) {
		try {
			await executor(
				(value) => this.resolve(value),
				(reason) => this.reject(reason)
			);
		} catch (error) {
			this.reject(error);
		}
	}

	protected async init_with_promise(promise: PromiseLike<T>) {
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

	protected reject(reason: any) {
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
			asyncFlatMap<PromiseArray<T>, T>(items, identity)
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

	/** calls a callback with an awaited value */
	static callback<T>(
		value: T,
		callback?: FutureCallback<T>,
		errorHandler?: ErrorHandler
	): void;

	/** calls a callback after awaiting a Future */
	static callback<T>(
		value: Future<T>,
		callback?: FutureCallback<T>,
		errorHandler?: ErrorHandler
	): void;

	/** calls a callback after awaiting a Promise */
	static callback<T>(
		value: Promise<T>,
		callback?: FutureCallback<T>,
		errorHandler?: ErrorHandler
	): void;

	/** calls a callback after awaiting a Thennable object */
	static callback<T>(
		value: Thennable<T>,
		callback: FutureCallback<T> = noop,
		errorHandler: ErrorHandler = noop
	): void {
		try {
			if (
				value &&
				(typeof value === 'object' || typeof value === 'function') &&
				'then' in value &&
				typeof value.then === 'function'
			) {
				Future.callback(
					value.then((value) => {
						Future.callback<T>(value, callback, errorHandler);
					}, errorHandler)
				);
			} else if (callback !== noop) {
				Future.callback(
					callback(value as Awaited<T>),
					noop,
					errorHandler
				);
			}
		} catch (error) {
			errorHandler(error);
		}
	}

	/**
	 * Transforms a callback consumer call into a `Future`.
	 * # Usage
	 * ```js
	 * function myFunction(callback) {
	 *   if (condition) {
	 *     callback(null, "Success")
	 *   } else {
	 *     callback("Error")
	 *   }
	 * }
	 *
	 * const future = Future.fromCallback(myFunction)
	 * ```
	 * Many [Node APIs](https://docs.nodejs.org/) and [old npm packages](https://npmjs.com/package/imap) behave like this.
	 */
	static fromCallback<T, E = unknown>(
		callback: (callback: (err: E, val: T) => void) => void
	): Future<T>;

	/**
	 * Transforms a callback consumer call into a `Future`.
	 * # Usage
	 * ```js
	 * const myObject = {
	 *   condition: sky.color === blue,
	 *   myMethod(callback) {
	 *     if (this.condition) {
	 *       callback(null, "Success")
	 *     } else {
	 *       callback("Error")
	 *     }
	 *   }
	 * }
	 *
	 * const future = Future.fromCallback(myObject, myObject.myMethod)
	 * ```
	 * Many [Node APIs](https://docs.nodejs.org/) and [old npm packages](https://npmjs.com/package/imap) behave like this.
	 */
	static fromCallback<T, E = unknown>(
		thisArg: object,
		callback: (callback: (err: E, val: T) => void) => void
	): Future<T>;

	static fromCallback<T, E = unknown>(
		thisArg: object | ((callback: (err: E, val: T) => void) => void),
		callback?: (callback: (err: E, val: T) => void) => void
	): Future<T> {
		return new Future<T>((resolve, reject) => {
			const resolver = (err: E, val: T) => {
				err ? reject(err) : resolve(val);
			};

			if (typeof callback === 'function') {
				callback.call(thisArg, resolver);
			} else if (typeof thisArg === 'function') {
				thisArg(resolver);
			} else {
				throw new TypeError(
					`Future.fromCallback(${thisArg}) is not valid.`
				);
			}
		});
	}

	_interval?: number;
	_poll?: FutureOptions<T>['poll'];
	_poll_timeout?: ReturnType<typeof setTimeout>;

	/**
	 * calls this Future's poll callback
	 * @returns a Future that resolves to this Future, or undefined
	 */
	poll(): Future<T | undefined> {
		return new Future(async (resolve) => {
			try {
				clearTimeout(this._poll_timeout);

				if (this.resolved || this.rejected) {
					return resolve(this);
				}

				const value = await this._poll?.();

				if (value === undefined) {
					this.schedule_poll();

					return resolve(undefined);
				} else {
					this.resolve(value);
				}
			} catch (reason) {
				this.reject(reason);
			}

			return resolve(this);
		});
	}

	schedule_poll() {
		this._poll_timeout = setTimeout(() => this.poll(), this._interval);
	}
}

export class LazyFuture<T> extends Future<T> {
	protected init;
	callbacks = new Set<(self: Future<T>) => any>();

	constructor(
		executor_or_promise: Executor<T> | PromiseLike<T>,
		options: FutureOptions<T> = {}
	) {
		super(noop);

		this.init = once(() => {
			const future = new Future<T>(executor_or_promise, {
				...options,
				lazy: false,
			});

			future.then(
				(value) => this.resolve(value),
				(error) => this.reject(error)
			);

			return future;
		});
	}

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
		setTimeout(this.init);

		return super.then(onfulfilled, onrejected);
	}

	/**
	 * Transforms a callback consumer call into a `LazyFuture`.
	 * # Usage
	 * ```js
	 * function myFunction(callback) {
	 *   if (condition) {
	 *     callback(null, "Success")
	 *   } else {
	 *     callback("Error")
	 *   }
	 * }
	 *
	 * const future = LazyFuture.fromCallback(myFunction)
	 * ```
	 * Many [Node APIs](https://docs.nodejs.org/) and [old npm packages](https://npmjs.com/package/imap) behave like this.
	 */
	static fromCallback<T, E = unknown>(
		callback: (callback: (err: E, val: T) => void) => void
	): LazyFuture<T>;

	/**
	 * Transforms a callback consumer call into a `LazyFuture`.
	 * # Usage
	 * ```js
	 * const myObject = {
	 *   condition: sky.color === blue,
	 *   myMethod(callback) {
	 *     if (this.condition) {
	 *       callback(null, "Success")
	 *     } else {
	 *       callback("Error")
	 *     }
	 *   }
	 * }
	 *
	 * const future = LazyFuture.fromCallback(myObject, myObject.myMethod)
	 * ```
	 * Many [Node APIs](https://docs.nodejs.org/) and [old npm packages](https://npmjs.com/package/imap) behave like this.
	 */
	static fromCallback<T, E = unknown>(
		thisArg: object,
		callback: (callback: (err: E, val: T) => void) => void
	): LazyFuture<T>;

	static fromCallback<T, E = unknown>(
		thisArg: object | ((callback: (err: E, val: T) => void) => void),
		callback?: (callback: (err: E, val: T) => void) => void
	): LazyFuture<T> {
		return new LazyFuture<T>((resolve, reject) => {
			const resolver = (err: E, val: T) => {
				err ? reject(err) : resolve(val);
			};

			if (typeof callback === 'function') {
				callback.call(thisArg, resolver);
			} else if (typeof thisArg === 'function') {
				thisArg(resolver);
			} else {
				throw new TypeError(
					`LazyFuture.fromCallback(${thisArg}) is not valid.`
				);
			}
		});
	}
}

export default Future;

Object.defineProperties(Future, {
	default: { get: () => Future },
	Future: { get: () => Future },
	LazyFuture: { get: () => LazyFuture },
});
