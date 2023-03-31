/** Maps keys to counters. **/
export class CounterMap<T> extends Map<T, number> {
	/**
	 * Retreive the value mapped to a key.
	 * @returns the value, or 0 if NaN
	 */
	get(key: T) {
		return Number(super.get(key)) || 0;
	}

	/**
	 * increment a counter
	 * @returns the counter's new value
	 */
	increment(key: T) {
		const new_value = (Number(super.get(key)) || 0) + 1;

		this.set(key, new_value);

		return new_value;
	}

	/**
	 * decrement a counter
	 * @returns the counter's new value
	 */
	decrement(key: T) {
		const new_value = (Number(super.get(key)) || 0) - 1;

		this.set(key, new_value);

		return new_value;
	}

	/**
	 * reset a counter
	 * @returns the counter's new value = 0
	 */
	reset(key: T) {
		this.set(key, 0);

		return 0;
	}
}

export default CounterMap;

Object.defineProperties(CounterMap, {
	default: { get: () => CounterMap },
	CounterMap: { get: () => CounterMap },
});
