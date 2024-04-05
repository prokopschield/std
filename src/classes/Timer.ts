import noop from '../functions/noop';
import Future from './Future';

export type TimerData = {
	last: number;
	interval: number;
	iterations: number;
};

export type TimerSubscriber = (_data: TimerData) => any;

export class Timer extends Future<TimerData> implements TimerData {
	last: number;
	interval: number;
	timeout: ReturnType<typeof setTimeout>;
	iterations = 0;
	subscribers = new Set<TimerSubscriber>();

	guard: TimerData = new Proxy(this, {
		get(target, key: keyof Timer) {
			if (key !== 'then') {
				return target[key];
			}
		},
	});

	constructor(interval: bigint | number | unknown) {
		super(noop);

		this.last = Date.now();
		this.interval = Number(interval) || 0;
		this.timeout = setTimeout(this.check);
	}

	async call() {
		this.last += this.interval;
		this.iterations++;

		for (const subscriber of this.subscribers) {
			super.then(subscriber);
		}

		if (!this.resolved) {
			this.resolve(this.guard);
		}

		this.callbacks.add(this.clear);
	}

	check = (recheck = false) => {
		clearTimeout(this.timeout);

		const now = Date.now();

		if (now >= this.last + this.interval) {
			this.call();
		}

		if (this.subscribers.size || this.callbacks.size || recheck) {
			this.resolved = false;

			this.timeout = setTimeout(
				this.check,
				this.last + this.interval - now
			);
		}
	};

	clear = () => {
		this.resolved = false;
		this.rejected = false;
	};

	reset(now = Date.now()) {
		this.clear();
		this.last = now;
		this.check();
	}

	subscribe(callback: TimerSubscriber) {
		this.subscribers.add(callback);

		this.check();

		return () => this.subscribers.delete(callback);
	}

	then<TResult1 = void, TResult2 = never>(
		onfulfilled?:
			| ((value: TimerData) => TResult1 | PromiseLike<TResult1>)
			| null
			| undefined,
		onrejected?:
			| ((reason: any) => TResult2 | PromiseLike<TResult2>)
			| null
			| undefined
	): Future<TResult1 | TResult2> {
		setTimeout(this.check);

		return super.then(onfulfilled, onrejected);
	}
}

export default Timer;

Object.defineProperties(Timer, {
	default: { get: () => Timer },
	Timer: { get: () => Timer },
});
