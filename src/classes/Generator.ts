export class PsGenerator<type> implements Generator<type, type, type> {
	generator: Generator<type, type, type>;
	constructor(fn: () => type) {
		this.generator = (function* (): Generator<type, type, type> {
			let value: type = fn();
			while (true) {
				let nv = yield value;
				if (nv) {
					value = nv;
				} else if ((value = fn()) === undefined) {
					return fn();
				}
			}
		})();
	}
	next(val?: type | undefined) {
		return val ? this.generator.next(val) : this.generator.next();
	}
	return(val: type) {
		return this.generator.return(val);
	}
	throw(err: Error) {
		return this.generator.throw(err);
	}
	*[Symbol.iterator]() {
		while (true) {
			const { done, value } = this.next();
			if (done) {
				return value;
			} else {
				yield value;
			}
		}
	}
	/**
	 * Join multiple generators together
	 * @param comparing_fn Determines order of element: -1 for left first, 1 for right first
	 * @param generators
	 */
	static *join<type>(
		comparing_fn: (left: type, right: type) => number | boolean,
		...generators: Array<
			| PsGenerator<type>
			| Generator<type, type | undefined, type | undefined>
		>
	): Generator<type, undefined, type | undefined> {
		let [first, second, third, ...rest] = generators;
		if (generators.length > 2) {
			first = PsGenerator.join(comparing_fn, first, second);
			second = rest.length
				? PsGenerator.join(comparing_fn, third, ...rest)
				: third;
		}
		if (generators.length >= 2) {
			let left = first.next();
			let right = second.next();
			while (!left.done || !right.done) {
				if (left.value !== undefined) {
					if (right.value !== undefined) {
						if (comparing_fn(left.value, right.value) > 0) {
							let new_right = yield right.value;
							if (new_right === undefined) {
								right = second.next();
							} else {
								right = {
									done: false,
									value: new_right,
								};
							}
						} else {
							let new_left = yield left.value;
							if (new_left === undefined) {
								left = first.next();
							} else {
								left = {
									done: false,
									value: new_left,
								};
							}
						}
					} else if (right.done) {
						while (!left.done) {
							let new_left: type | undefined = yield left.value;
							if (new_left === undefined) {
								left = first.next();
							} else {
								left = {
									done: false,
									value: new_left,
								};
							}
						}
					} else {
						right = second.next();
					}
				} else if (left.done) {
					while (!right.done) {
						let new_right: type | undefined = yield right.value;
						if (new_right === undefined) {
							right = second.next();
						} else {
							right = {
								done: false,
								value: new_right,
							};
						}
					}
				} else {
					left = first.next();
				}
			}
		} else if (generators.length === 1) {
			for (let val of first) {
				while (val !== undefined) {
					const newval = yield val;
					if (newval !== undefined) val = newval;
				}
			}
		} else {
			return undefined;
		}
	}
}

export default PsGenerator;

export { PsGenerator as Generator };

Object.defineProperties(PsGenerator, {
	default: { get: () => PsGenerator },
	PsGenerator: { get: () => PsGenerator },
	Generator: { get: () => PsGenerator },
});
