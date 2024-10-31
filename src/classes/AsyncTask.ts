/** The three possible states of a Task or Job */
export enum AsyncState {
	pending,
	fulfilled,
	failed,
}

/** Resolves to T */
export class AsyncTask<T = unknown> implements PromiseLike<T> {
	callbacks = new Array<(task: this) => any>();
	state = AsyncState.pending;
	reason?: unknown;
	value?: T;

	read(): T {
		switch (this.state) {
			case AsyncState.pending:
				throw new Error('task pending - yield before calling .read()');
			case AsyncState.fulfilled:
				return this.value!;
			case AsyncState.failed:
				throw this.reason!;
			default:
				throw new Error(`Invalid state: ${this.state}`);
		}
	}

	fail(reason: any): this {
		this.reason = reason;
		this.state = AsyncState.failed;

		return this.flush();
	}

	resolve(value: T | PromiseLike<T>): this {
		try {
			if (
				(typeof value === 'object' || typeof value === 'function') &&
				value &&
				'then' in value
			) {
				const then = value.then;

				if (typeof then === 'function') {
					then.call(
						value,
						this.resolve.bind(this),
						this.fail.bind(this)
					);

					return this;
				}
			}

			this.value = value as T;
			this.state = AsyncState.fulfilled;
		} catch (error) {
			this.fail(error);
		}

		return this.flush();
	}

	flush(): this {
		if (this.state === AsyncState.pending) {
			return this;
		}

		while (this.callbacks.length) {
			const callback = this.callbacks.shift();

			if (typeof callback !== 'function') {
				continue;
			}

			callback(this);
		}

		return this;
	}

	then<T1 = T, T2 = never>(
		success?: (value: T) => T1 | PromiseLike<T1>,
		failure?: (reason: unknown) => T2 | PromiseLike<T2>
	): AsyncTask<T1 | T2> {
		const task = new AsyncTask<T1 | T2>();

		try {
			if (this.state === AsyncState.fulfilled) {
				task.resolve(
					success ? success(this.value!) : (this.value as T1)
				);
			} else if (this.state === AsyncState.failed) {
				failure
					? task.resolve(failure(this.reason))
					: task.fail(this.reason);
			} else {
				this.callbacks.push(() =>
					this.then(success, failure).then(
						(value) => task.resolve(value),
						(reason) => task.fail(reason)
					)
				);
			}
		} catch (error) {
			task.fail(error);
		}

		return task;
	}

	static from<T>(value: T | PromiseLike<T>): AsyncTask<T> {
		return new AsyncTask<T>().resolve(value);
	}
}

export default AsyncTask;

Object.defineProperties(AsyncTask, {
	default: { get: () => AsyncTask },
	AsyncTask: { get: () => AsyncTask },
});
