export type PromiseArray<T> =
	| Array<T>
	| Array<PromiseLike<T>>
	| PromiseLike<Array<T>>
	| PromiseLike<Array<PromiseLike<T>>>
	| Array<T | PromiseLike<T>>
	| PromiseLike<Array<T | PromiseLike<T>>>;

export type AsyncFlatIterable<T> = IterableIterator<
	Awaited<PromiseArray<T>>[number]
>;

export type AsyncFlatMappable<T> =
	| AsyncFlatIterable<T>
	| PromiseLike<AsyncFlatIterable<T>>
	| PromiseArray<T>;

export type AwaitedArrayMember<T> = Awaited<T[keyof T & number]>;

export type AsyncMemberNP<T> = T extends
	| Array<infer _T>
	| Array<PromiseLike<infer _T>>
	| Array<infer _T | PromiseLike<infer _T>>
	? AwaitedArrayMember<T>
	: T;

export type AsyncMember<T> = AsyncMemberNP<Awaited<T>>;

export type Transform<A, B> = (_a: A) => B | PromiseLike<B> | PromiseArray<B>;

export async function asyncFlatMap<A, B>(
	self: AsyncFlatMappable<A>,
	transform: Transform<A, B>
): Promise<B[]> {
	const awaited = await self;
	const items = awaited?.[Symbol.iterator]
		? await Promise.all(awaited)
		: ([awaited] as [A]);

	const transformed: Array<B | PromiseArray<B>> = [];

	await Promise.all(
		items.map(async (item) => {
			if (Array.isArray(item)) {
				for (const subitem of item.map(transform)) {
					transformed.push(await subitem);
				}
			} else {
				transformed.push(await transform(item));
			}
		})
	);

	const final = new Array<B>();

	for (const item of transformed) {
		const awaited = await item;

		if (Array.isArray(awaited)) {
			for (const subitem of awaited) {
				final.push(await subitem);
			}
		} else {
			final.push(awaited);
		}
	}

	return final;
}

export default asyncFlatMap;

Object.defineProperties(asyncFlatMap, {
	default: { get: () => asyncFlatMap },
	asyncFlatMap: { get: () => asyncFlatMap },
});

if (!Object.prototype.hasOwnProperty.call(Array.prototype, 'asyncFlatMap')) {
	Object.defineProperty(Array.prototype, 'asyncFlatMap', {
		configurable: true,
		enumerable: false,
		value: function asyncFlatMapThis<A, B>(
			this: PromiseArray<A>,
			transform: Transform<A, B>
		) {
			return asyncFlatMap<A, B>(this, transform);
		},
	});
}

if (!Object.prototype.hasOwnProperty.call(Promise.prototype, 'asyncFlatMap')) {
	Object.defineProperty(Promise.prototype, 'asyncFlatMap', {
		configurable: true,
		enumerable: false,
		value: function asyncFlatMapThis<A, B>(
			this: PromiseArray<A>,
			transform: Transform<A, B>
		) {
			return asyncFlatMap<A, B>(this, transform);
		},
	});
}
