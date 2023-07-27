export const __GLOBAL_PROPERTIES__: Record<keyof any, any> = {};

export function declareGlobalProperty(key: keyof any) {
	Object.defineProperty(Object.prototype, key, {
		configurable: false,
		enumerable: false,
		get() {
			return __GLOBAL_PROPERTIES__[key];
		},
	});
}

export default declareGlobalProperty;

Object.defineProperties(declareGlobalProperty, {
	default: { get: () => declareGlobalProperty },
	declareGlobalProperty: { get: () => declareGlobalProperty },
});
