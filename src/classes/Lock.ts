import delay from '../functions/delay';

export class Lock {
	protected _callbacks = new Array<Function>();
	protected _counter = 0;

	protected _parent?: Lock;

	constructor(parent?: Lock, locked?: number | boolean) {
		this._parent = parent;
		this._counter = Number(locked) || 0;
	}

	/**
	 * Locks this lock, unlock the returned lock once you're done with this resource.
	 * @returns a new lock
	 */
	lock() {
		if (this._parent && this._counter === 0) {
			this._parent.lock();
		}

		this._counter++;

		return new Lock(this, 1);
	}

	/** Unlocks this lock. */
	async unlock() {
		if (this._counter) {
			this._counter = 0;

			while (this._counter === 0 && this._callbacks.length) {
				this._callbacks.shift()?.();
				await delay(1);
			}

			if (this._parent) {
				if (this._parent._counter <= 1) {
					this._parent.unlock();
				} else {
					--this._parent._counter;
				}
			}
		}
	}

	/** Alias of .unlock() */
	release() {
		return this.unlock();
	}

	/** Gets a promise which resolves when this lock is unlocke. */
	get promise(): Promise<void> {
		return new Promise<void>((resolve) =>
			this._counter ? this._callbacks.push(resolve) : resolve()
		);
	}

	/** Will be called when the lock is unlocked. */
	set callback(callback: Function) {
		this._callbacks.push(callback);
	}

	/** Waits for this lock to be unlocked, then locks. */
	async wait_and_lock(): Promise<Lock> {
		while (this._counter) {
			await this.promise;
		}

		return this.lock();
	}
}

export default Lock;

Object.defineProperties(Lock, {
	default: { get: () => Lock },
	Lock: { get: () => Lock },
});
