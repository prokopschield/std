import identity from '../functions/identity';
import Future from './Future';

const symbol = Symbol.for('盾標準図書館結果');

export abstract class Result<T = undefined, E = unknown> {
	abstract unwrap(): T;
	abstract into(): T | E;
	abstract map<Ook, Oerr = E>(
		ok: (value: T) => Ook,
		err?: (error: E) => Oerr
	): Result<Ook, Oerr>;
	abstract map_async<Ook, Oerr = E>(
		ok: (value: T) => Ook | PromiseLike<Ook>,
		err?: (error: E) => Oerr | PromiseLike<Oerr>
	): FutureResult<Ook, Oerr>;
	abstract map_err<Oerr>(err: (error: E) => Oerr): Result<T, Oerr>;
	abstract map_err_async<Oerr>(
		err: (error: E) => Oerr | PromiseLike<Oerr>
	): FutureResult<T, Oerr>;
	abstract toJSON(): { ok: T } | { error: E };
	protected abstract [symbol]: T | E;
	static unwrap<T>(result: T | Result<T>): T {
		if (result && typeof result === 'object' && symbol in result) {
			return result.unwrap();
		} else {
			return result;
		}
	}
	static from<T, E = never>(value: T | Result<T, E>): Result<T, unknown> {
		try {
			return Ok(Result.unwrap(value));
		} catch (err) {
			return Err(err);
		}
	}
	abstract or<A>(value: A): T | A;
	abstract or_else<A>(err: (error: E) => A): T | A;
	abstract or_else_async<A>(
		err: (error: E) => A | PromiseLike<A>
	): Future<T | A>;
}

export class OkResult<T = undefined, E = unknown> extends Result<T, E> {
	protected [symbol]: T;

	constructor(value: T) {
		super();
		this[symbol] = value;
	}

	unwrap(): T {
		return this[symbol];
	}

	into(): T {
		return this[symbol];
	}

	map<Ook, Oerr = E>(
		ok: (value: T) => Ook,
		_err?: (error: E) => Oerr
	): OkResult<Ook, Oerr> {
		return new OkResult(ok(this[symbol]));
	}

	map_async<Ook, Oerr = E>(
		ok: (value: T) => Ook | PromiseLike<Ook>,
		_err?: (error: E) => Oerr | PromiseLike<Oerr>
	): FutureResult<Ook, Oerr> {
		return new FutureResult(() => ok(this[symbol]));
	}

	map_err<Oerr>(_err: (error: E) => Oerr): OkResult<T, Oerr> {
		return this as unknown as OkResult<T, Oerr>;
	}

	map_err_async<Oerr>(
		_err: (error: E) => Oerr | PromiseLike<Oerr>
	): FutureResult<T, Oerr> {
		return new FutureResult(() => this[symbol]);
	}

	toJSON() {
		return { ok: this[symbol] };
	}

	or() {
		return this[symbol];
	}

	or_else() {
		return this[symbol];
	}

	or_else_async<A>() {
		return new Future<T | A>(() => this[symbol]);
	}
}

export class ErrResult<T = undefined, E = unknown> extends Result<T, E> {
	protected [symbol]: E;

	constructor(error: E) {
		super();
		this[symbol] = error;
	}

	unwrap(): never {
		throw this[symbol];
	}

	into(): E {
		return this[symbol];
	}

	map<Ook, Oerr = E>(
		_ok: (value: T) => Ook,
		err?: (error: E) => Oerr
	): Result<Ook, Oerr> {
		if (err) {
			return new ErrResult(err(this[symbol]));
		} else {
			return this as unknown as Result<Ook, Oerr>;
		}
	}

	map_async<Ook, Oerr = E>(
		_ok: (value: T) => Ook | PromiseLike<Ook>,
		err?: (error: E) => Oerr | PromiseLike<Oerr>
	): FutureResult<Ook, Oerr> {
		return new FutureResult<Ook, Oerr>(async () => {
			if (err) {
				throw await err(this[symbol]);
			} else {
				throw this[symbol];
			}
		});
	}

	map_err<Oerr>(err: (error: E) => Oerr): Result<T, Oerr> {
		return this.map(identity, err);
	}

	map_err_async<Oerr>(
		err: (error: E) => Oerr | PromiseLike<Oerr>
	): FutureResult<T, Oerr> {
		return this.map_async(identity, err);
	}

	toJSON() {
		return { error: this[symbol] };
	}

	or<A>(value: A) {
		return value;
	}

	or_else<A>(err: (error: E) => A) {
		return err(this[symbol]);
	}

	or_else_async<A>(err: (error: E) => A | PromiseLike<A>): Future<T | A> {
		return new Future((resolve) => resolve(err(this[symbol])));
	}
}

export class FutureResult<T, E = unknown> extends Future<Result<T, E>> {
	constructor(resolver: () => T | PromiseLike<T>) {
		super(async (resolve) => {
			try {
				resolve(new OkResult(await resolver()) as Result<T, E>);
			} catch (error) {
				resolve(new ErrResult(error as E));
			}
		});
	}

	map_async<Ook, Oerr = E>(
		ok: (value: T) => Ook | PromiseLike<Ook>,
		err?: (error: E) => Oerr | PromiseLike<Oerr>
	): FutureResult<Ook, Oerr> {
		return new FutureResult<Ook, Oerr>(() =>
			this.then((result) =>
				result.map_async(ok, err).then((result) => result.unwrap())
			)
		);
	}

	map_err_async<Oerr>(
		err: (error: E) => Oerr | PromiseLike<Oerr>
	): FutureResult<T, Oerr> {
		return new FutureResult<T, Oerr>(() =>
			this.then((result) =>
				result.map_err_async(err).then((result) => result.unwrap())
			)
		);
	}

	unwrap(): Future<T> {
		return this.then((result) => result.unwrap());
	}

	or<A>(value: A) {
		return this.then(
			(result) => result.or(value),
			() => value
		);
	}

	or_else<A>(err: (error: E) => A) {
		return this.then((result) => result.or_else(err), err);
	}

	or_else_async<A>(err: (error: E) => A | PromiseLike<A>) {
		return this.then((result) => result.or_else(err), err);
	}
}

export type OkFactory = <T, E = never>(value: T) => OkResult<T, E>;
export type ErrFactory = <T = never, E = void>(error: E) => ErrResult<T, E>;

export const Ok = new Proxy(OkResult, {
	apply(_ok, _this, [value]) {
		return new OkResult(value);
	},
}) as unknown as typeof OkResult & OkFactory;

export const Err = new Proxy(ErrResult, {
	apply(_err, _this, [error]) {
		return new ErrResult(error);
	},
}) as unknown as typeof ErrResult & ErrFactory;

export default Result;

for (const _ of [Result, FutureResult]) {
	Object.defineProperties(_, {
		default: { get: () => Result },
		FutureResult: { get: () => FutureResult },
		Result: { get: () => Result },
		Ok: { get: () => Ok },
		Err: { get: () => Err },
	});
}
