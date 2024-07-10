export type Extended<A, B> = (A extends Function ? A : B) & {
	[K in keyof (A & B)]: K extends keyof B
		? B[K]
		: K extends keyof A
		? A[K]
		: unknown;
};

/**
 * Creates an object extension
 * @param parent any extensible object or function
 * @param extensions optional objects providing additional properties
 * @returns `A & B`
 * ### How are properties and methods resolved?
 * - calling the extent directly invokes the parent if the parent
 */
export function extend<A extends Function | object, B>(
	parent: A,
	...extensions: B[]
): Extended<A, B> {
	const callable = [parent, ...extensions, () => extent].reduce(
		(left, right) => {
			return typeof left === 'function' ? left : right;
		}
	);

	const { extent: caller } = {
		extent(this: any) {
			return (callable as Function).apply(this || extent, arguments);
		},
	};

	const proxy = new Proxy(parent, {
		get(_target, name) {
			const key = name as keyof A & keyof B;
			const ext = extensions.find((ext) => ext?.[key]) ?? parent;
			const prop = ext?.[key];

			return typeof prop === 'function' ? prop.bind(ext) : prop;
		},
	});

	const extent = Object.setPrototypeOf(caller, proxy) as Extended<A, B>;

	return extent;
}

export default extend;

Object.defineProperties(extend, {
	default: { get: () => extend },
	extend: { get: () => extend },
});
