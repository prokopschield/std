export type Callback = (val?: any) => void;

export class Queue {
	error_handler?: Callback;
	constructor(error_handler?: Callback) {
		this.error_handler = error_handler;
	}
	/** Is a process ongoing? */
	working = false;
	/** Queued callbacks */
	queue = Array<Callback>();
	/** Call next() after call stack resolved */
	next_async() {
		setTimeout(() => this.next());
	}
	/** Call the next callback */
	next() {
		const next = this.queue.shift();
		try {
			return next ? next() : (this.working = false);
		} catch (error) {
			if (this.error_handler) {
				this.error_handler(error);
			} else {
				throw error;
			}
		}
	}
	/** Add a callback */
	add(cb: Callback) {
		if (this.working) {
			return this.queue.push(cb);
		} else {
			this.working = true;
			return cb();
		}
	}
	/** Get a promise */
	get promise() {
		return new Promise((resolve) => this.add(resolve));
	}
}

export default Queue;

Object.defineProperties(Queue, {
	default: { get: () => Queue },
	Queue: { get: () => Queue },
});
