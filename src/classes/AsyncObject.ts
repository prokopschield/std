import { AsyncTrap, asyncTrap } from '../functions/asyncTrap';
import { identity } from '../functions/identity';
import { Lock } from './Lock';

const READ = Symbol('READ');
const DKEY = Symbol('value');

export type AnyRec = Record<keyof any, any>;
export type AnyObj = AnyRec | (Function & AnyRec);

export type AsyncObjectLookup<Rec extends AnyRec, Key extends keyof Rec> = (
	key: Key,
	new_value?: Rec[Key]
) => Promise<Rec[Key]>;

export type AsyncObjectInvocable<Base extends AnyRec> = Base extends Function
	? Base
	: AsyncObjectLookup<Base, keyof Base>;

export type AsyncObject<Rec extends AnyRec> = {
	[Key in keyof Rec]: AsyncTrap<Key>;
} & AsyncObjectInvocable<Rec>;

export function AsyncObject<Base extends AnyObj>(
	base: Base
): AsyncObject<Base> {
	const lock = new Lock();

	const resolver = async function AsyncObjectResolver<K extends keyof Base>(
		raw_key: K,
		raw_value: Base[K] | PromiseLike<Base[K]> | typeof READ = READ
	) {
		const guard = await lock.wait_and_lock();

		try {
			type Tt = AsyncObject<Base> | AsyncTrap<Base[K]>;

			let target: Tt = proxy;

			const key_str = String(raw_key);
			const key_parts = key_str.split(/[,/:]/g).filter(identity) as K[];
			const key_final = key_parts.pop() || (DKEY as K);
			const new_value = await raw_value;

			for (const part of key_parts) {
				const property = (await target[part]) as Tt | undefined;

				if (!property) {
					const blank = AsyncObject({});

					target[part as K] = blank as Tt[K];
					target = blank as Tt;
				} else if (
					typeof property === 'function' ||
					typeof property === 'object'
				) {
					target = asyncTrap(property);
				}
			}

			if (new_value === READ) {
				return target[key_final as K];
			} else if (new_value === null || new_value === undefined) {
				delete target[key_final as K];
			} else if (
				typeof new_value === 'object' ||
				typeof new_value === 'function'
			) {
				return (target[key_final as K] = asyncTrap(new_value) as Tt[K]);
			} else {
				return (target[key_final as K] = new_value as Tt[K]);
			}
		} finally {
			guard.release_async();
		}
	};

	const proxy = new Proxy(typeof base === 'function' ? base : resolver, {
		get(_, key) {
			return base[key as keyof Base];
		},
	}) as AsyncObject<Base>;

	return proxy;
}

export default AsyncObject;

Object.defineProperties(AsyncObject, {
	default: { get: () => AsyncObject },
	AsyncObject: { get: () => AsyncObject },
});
