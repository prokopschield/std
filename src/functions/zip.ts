export interface Zip {
	<T extends any[]>(...arrays: { [K in keyof T]: T[K][] }): {
		[K in keyof T]: T[K];
	}[];
}

export function* Iterator<T>(array: Iterable<T>) {
	for (const item of array) {
		yield item;
	}
}

export function* Zipper<T>(...arrays: Array<Iterable<T>>) {
	const iterators = arrays.map(Iterator);
	let done_counter = 0;
	let return_array: T[] = [];

	for (; done_counter != iterators.length; return_array = []) {
		done_counter = 0;

		for (let index = 0; index < iterators.length; ++index) {
			const { done, value } = iterators[index].next();

			if (done) {
				++done_counter;
			} else {
				return_array[index] = value;
			}
		}

		if (done_counter !== iterators.length) {
			yield return_array;
		}
	}
}

export const zip: Zip = ((...input: any[][]) => {
	return [...Zipper(...input)];
}) as Zip;
