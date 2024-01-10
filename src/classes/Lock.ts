import delay from '../functions/delay';
import makeUnawaitable from '../functions/makeUnawaitable';
import type { Unawaitable } from '../functions/unawaitable';

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
	lock(): Unawaitable<Lock> {
		if (this._parent && this._counter === 0) {
			this._parent.lock();
		}

		this._counter++;

		return makeUnawaitable(new Lock(this, 1));
	}

	/** Unlocks this lock. */
	async unlock() {
		if (this._counter) {
			this._counter = 0;

			while (this._counter === 0 && this._callbacks.length) {
				this._callbacks.shift()?.();
				await delay(1);
			}

			if (this._parent && this._counter === 0) {
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

	/** Gets a promise which resolves when this lock is unlocked. */
	get promise(): Promise<void> {
		return new Promise<void>((resolve) =>
			this._counter ? this._callbacks.push(resolve) : resolve()
		);
	}

	/** executes callback after lock unlocked */
	async then(callback: (self: Unawaitable<Lock>) => any) {
		await this.promise;

		return callback(makeUnawaitable(this));
	}

	/** Will be called when the lock is unlocked. */
	set callback(callback: Function) {
		this._callbacks.push(callback);
	}

	/** Waits for this lock to be unlocked, then locks. */
	async wait_and_lock(): Promise<Unawaitable<Lock>> {
		while (this._counter) {
			await this.promise;
		}

		return this.lock();
	}

	/**
	 * Attempt to lock synchronously (if not locked)
	 * @returns a Lock upon success, does not throw on failure
	 */
	try_lock_sync(): Unawaitable<Lock> | void {
		if (!this._counter) {
			return this.lock();
		}
	}

	/** @returns `>= 1` if lock is locked, `0` otherwise */
	get locked() {
		return this._counter;
	}
}

export default Lock;

Object.defineProperties(Lock, {
	default: { get: () => Lock },
	Lock: { get: () => Lock },
});
