/**
 * Identity function, returns its first argument
 * @param item
 * @returns `item`
 */
export function identity<T>(item: T): T {
	return item;
}

export default identity;

Object.defineProperties(identity, {
	default: { get: () => identity },
	identity: { get: () => identity },
});
