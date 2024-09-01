import Lock from './Lock';

/** asynchronous unix-like semaphore */
export class Semaphore {
	lock = new Lock();
	value: number;

	/** value is the initial number of allowed concurrent tasks */
	constructor(value: bigint | number | string) {
		this.value = Number(value) || 0;
	}

	/** increments semaphore */
	async post() {
		++this.value;

		await this.lock.unlock();

		return this.value;
	}

	/** decrements semaphore */
	async wait() {
		while (this.value <= 0) {
			await this.lock.wait_and_lock();
		}

		return --this.value;
	}
}
