export const __GLOBALS__: Record<keyof any, any> = {};

export function declareGlobal(key: keyof any) {
	Object.defineProperty(globalThis, key, {
		configurable: false,
		enumerable: false,
		get() {
			return __GLOBALS__[key];
		},
	});
}

export default declareGlobal;

Object.defineProperties(declareGlobal, {
	default: { get: () => declareGlobal },
	declareGlobal: { get: () => declareGlobal },
});
