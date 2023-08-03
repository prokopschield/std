/** Each key of a SetMap maps to a Set, never to undefined. */
export class SetMap<K, V> extends Map<K, Set<V>> {
	/** Will implicitly create the Set if it does not exist. */
	get(key: K): Set<V> {
		const existing = super.get(key);

		if (existing) {
			return existing;
		} else {
			return this.setV(key).get(key);
		}
	}

	/** Adds new values to the existing set. */
	add(key: K, ...values: V[]) {
		const set = this.get(key);

		for (const value of values) {
			set.add(value);
		}

		return set;
	}

	/** Removes values from a set. */
	remove(key: K, ...values: V[]) {
		const set = this.get(key);

		for (const value of values) {
			set.delete(value);
		}

		return set;
	}

	/** Replaces the existing set with new values. */
	set(key: K, values: V[] | Set<V>) {
		return super.set(key, new Set(values));
	}

	/** Replaces the existing set with new values. */
	setV(key: K, ...values: V[]) {
		return super.set(key, new Set(values));
	}
}

export default SetMap;

Object.defineProperties(SetMap, {
	default: { get: () => SetMap },
	SetMap: { get: () => SetMap },
});
