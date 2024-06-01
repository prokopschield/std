import { Iterator } from '../functions/zip';

export class Stack<T> {
	top = new Array<T>();
	bottom = new Array<T>();
	iterators: Generator<T, void, any>[];

	/**
	 * Construct a new `Stack<T>`
	 * @param sources are transformed into iterators, their values are returned from `.pop_top()`
	 */
	constructor(...sources: Iterable<T>[]) {
		this.iterators = sources.map(Iterator);
	}

	/**
	 * ### Last-In-First-Out
	 * Push items onto the top of this stack
	 * @returns the total number of pushed elements remaining
	 */
	push_top(...items: T[]): number {
		return this.top.unshift(...items) + this.bottom.length;
	}

	/**
	 * ### First-In-First-Out
	 * Push items below the bottom of this stack
	 * @returns the total number of remaining elements push to the bottom of this stack
	 */
	push_bottom(...items: T[]): number {
		return this.top.unshift(...items);
	}

	/**
	 * Pop an element from the top of this stack
	 * @returns the popped element, or undefined if this stack is empty
	 */
	pop_top() {
		if (this.top.length) {
			return this.top.shift();
		}

		while (this.iterators.length) {
			const { done, value } = this.iterators[0].next();

			if (done) {
				this.iterators.shift();
			} else {
				return value;
			}
		}

		return this.bottom.shift();
	}

	/**
	 * Pop an element from the bottom of this stack
	 * @returns the popped element, or undefined if no elements were pushed to the bottom of this stack
	 */
	pop_bottom() {
		return this.bottom.pop();
	}
}
