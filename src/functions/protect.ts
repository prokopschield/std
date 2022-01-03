type ObjFn = object | Function;

/**
 * Wrap an object in a protective Proxy.
 *
 * **Does not protect against Object.preventExtensions**
 *
 * The Proxy can be used in place of the object,
 *
 * but the original object will not be modified.
 *
 * Non-scalar properties are protected automatically as well.
 *
 * @param obj The object being protected
 * @returns the protective proxy
 */
export function protect<T extends ObjFn>(obj: T): T {
	const decoy: any = {};
	const real: any = obj;
	let proto = Object.getPrototypeOf(real);
	if (proto) proto = protect(proto);
	const proxy: T = new Proxy(obj, {
		apply(_target, thisArg, argArray) {
			if (typeof real === 'function') {
				const ret = real.apply(thisArg || proxy, argArray);
				if (typeof ret === 'function' || typeof ret === 'object') {
					return protect(ret);
				} else {
					return ret;
				}
			} else return proxy;
		},
		construct(_target, argArray, _newTarget) {
			return protect(new real(...argArray));
		},
		defineProperty(_target, p, attributes) {
			Object.defineProperty(decoy, p, {
				configurable: true,
				...attributes,
			});
			return true;
		},
		deleteProperty(_target, p) {
			return delete decoy[p];
		},
		get(_target, p) {
			try {
				const value = decoy[p];
				if (value !== undefined) {
					return value;
				}
			} catch (error) {}
			const value = real[p];
			if (typeof value === 'object' || typeof value === 'function') {
				return protect(value);
			} else {
				return value;
			}
		},
		getOwnPropertyDescriptor(_target, p) {
			const decoy_descriptor = Object.getOwnPropertyDescriptor(decoy, p);
			if (decoy_descriptor) return decoy_descriptor;
			const real_descriptor = Object.getOwnPropertyDescriptor(real, p);
			if (real_descriptor) return protect(real_descriptor);
		},
		getPrototypeOf(_target) {
			return proto || Object.getPrototypeOf(decoy);
		},
		has(_target, p) {
			return p in decoy || p in real;
		},
		isExtensible(_target) {
			return Object.isExtensible(decoy) && Object.isExtensible(real);
		},
		ownKeys(_target) {
			return [
				...new Set([
					...Object.getOwnPropertyNames(decoy),
					...Object.getOwnPropertyNames(real),
				]),
			];
		},
		set(_target, p, v) {
			Object.defineProperty(decoy, p, {
				value: v,
				configurable: true,
				enumerable: true,
			});
			return true;
		},
		setPrototypeOf(_target, v) {
			proto = v;
			return true;
		},
	});
	return proxy;
}

export default protect;

Object.defineProperties(protect, {
	default: { get: () => protect },
	protect: { get: () => protect },
});
