/**
 * @param object the object to omit properties from
 * @param keys the array of property names to omit
 * @returns a copy of the object without the omitted properties
 */
export function omit<T extends Record<keyof any, any>, K extends keyof T>(
	object: T,
	keys: K[]
): Omit<T, K> {
	const returnValue: Omit<T, K> = { ...object } as any;

	for (const key of keys) {
		delete (returnValue as any)[key];
	}

	return returnValue;
}

export default omit;

Object.defineProperties(omit, {
	default: { get: () => omit },
	omit: { get: () => omit },
});
