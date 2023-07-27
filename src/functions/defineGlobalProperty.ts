import {
	declareGlobalProperty,
	__GLOBAL_PROPERTIES__,
} from './declareGlobalProperty';

export function defineGlobalProperty<K extends keyof any, V>(key: K, value: V) {
	__GLOBAL_PROPERTIES__[key] = value;

	if (!Object.getOwnPropertyDescriptor(Object.prototype, key)) {
		declareGlobalProperty(key);
	}
}

export default defineGlobalProperty;

Object.defineProperties(defineGlobalProperty, {
	default: { get: () => defineGlobalProperty },
	defineGlobalProperty: { get: () => defineGlobalProperty },
});
