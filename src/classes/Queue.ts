type Callback = (val?: any) => void;

export class Queue {
	/** Is a process ongoing? */
	working = false;
	/** Queued callbacks */
	queue = Array<Callback>();
	/** Call the next callback */
	next() {
		const next = this.queue.shift();
		return next ? next() : (this.working = false);
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
module.exports = Queue;

Object.defineProperties(Queue, {
	default: { get: () => Queue },
	Queue: { get: () => Queue },
});
