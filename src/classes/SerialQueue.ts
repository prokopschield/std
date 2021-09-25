import { Queue } from './Queue';

export class SerialQueue implements Queue {
	/** Internal queue object */
	_queue = new Queue();
	/** Internal queue array */
	get queue() {
		return this._queue.queue;
	}
	/** Is something being processed? */
	get working() {
		return this._queue.working;
	}
	/** Function that forces queue to process next callback */
	next_async() {
		setTimeout(this.next);
	}
	/** Function that forces queue to process next callback */
	get next() {
		const self = this;
		return () => {
			self._queue.next();
			setTimeout(() => {
				if (!this._queue.queue.length && !this._queue.working) {
					this._donecb();
				}
			});
		};
	}
	/** Add callback(s) to queue */
	get add() {
		const self = this;
		return (...callbacks: Array<CallableFunction>) => {
			for (const cb of callbacks) {
				this._queue.add(async () => {
					try {
						await cb();
					} catch (e) {}
					self.next_async();
				});
			}
		};
	}
	/** Get a Promise that will resolve once CURRENT callbacks are done */
	get promise() {
		const self = this;
		return new Promise((resolve) => self.add(resolve));
	}
	protected _done: Promise<void> | undefined;
	protected _donecb: () => void = () => {};
	get done() {
		if (this._done) {
			return this._done;
		} else {
			const self = this;
			return (self._done = new Promise(async (resolve) => {
				self._donecb = () => {
					self._done = undefined;
					resolve();
				};
				await self.promise;
			}));
		}
	}
}

export default SerialQueue;

Object.defineProperties(SerialQueue, {
	default: { get: () => SerialQueue },
	SerialQueue: { get: () => SerialQueue },
});
