export type PromiseArray<T> =
	| Array<T>
	| Array<Promise<T>>
	| Promise<Array<T>>
	| Promise<Array<Promise<T>>>
	| Array<T | Promise<T>>
	| Promise<Array<T | Promise<T>>>;

export type AwaitedArrayMember<T> = Awaited<T[keyof T & number]>;

export type AsyncMemberNP<T> = T extends
	| Array<infer _T>
	| Array<Promise<infer _T>>
	| Array<infer _T | Promise<infer _T>>
	? AwaitedArrayMember<T>
	: T;

export type AsyncMember<T> = AsyncMemberNP<Awaited<T>>;

export type Transform<A, B> = (_a: A) => B | Promise<B> | PromiseArray<B>;

export async function asyncFlatMap<A, B>(
	self: PromiseArray<A>,
	transform: Transform<A, B>
): Promise<B[]> {
	const items = await Promise.all(await self);

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

declare global {
	interface Array<T> {
		asyncFlatMap<R>(
			_transform: Transform<T[keyof T & number], AsyncMember<R>>
		): Promise<Array<AsyncMember<R>>>;
	}
	interface Promise<T> {
		asyncFlatMap<R>(
			_transform: Transform<T[keyof T & number], AsyncMember<R>>
		): Promise<Array<AsyncMember<R>>>;
	}
}
