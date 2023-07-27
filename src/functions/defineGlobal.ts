import { declareGlobal, __GLOBALS__ } from './declareGlobal';

export function defineGlobal<K extends keyof any, V>(key: K, value: V) {
	__GLOBALS__[key] = value;

	if (!Object.getOwnPropertyDescriptor(globalThis, key)) {
		declareGlobal(key);
	}
}

export default defineGlobal;

Object.defineProperties(defineGlobal, {
	default: { get: () => defineGlobal },
	defineGlobal: { get: () => defineGlobal },
});
