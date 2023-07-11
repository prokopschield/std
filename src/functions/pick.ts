/**
 * @param object the object to pick properties from
 * @param keys the array of property names to pick
 * @returns the object with only the picked properties
 */
export function pick<T extends Record<keyof any, any>, K extends keyof T>(
	object: T,
	keys: K[]
): { [P in K]: T[P] } {
	const returnValue: Pick<T, K> = {} as any;

	for (const key of keys) {
		returnValue[key] = object[key];
	}

	return returnValue;
}

export default pick;

Object.defineProperties(pick, {
	default: { get: () => pick },
	pick: { get: () => pick },
});
