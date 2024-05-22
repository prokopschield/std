import identity from '../functions/identity';
import Future from './Future';

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
	): Future<Result<Ook, Oerr>>;
	abstract map_err<Oerr>(err: (error: E) => Oerr): Result<T, Oerr>;
	abstract map_err_async<Oerr>(
		err: (error: E) => Oerr | PromiseLike<Oerr>
	): Future<Result<T, Oerr>>;
}

export class Ok<T = undefined, E = unknown> extends Result<T, E> {
	protected _value: T;

	constructor(value: T) {
		super();
		this._value = value;
	}

	unwrap(): T {
		return this._value;
	}

	into(): T {
		return this._value;
	}

	map<Ook, Oerr = E>(
		ok: (value: T) => Ook,
		_err?: (error: E) => Oerr
	): Ok<Ook, Oerr> {
		return new Ok(ok(this._value));
	}

	map_async<Ook, Oerr = E>(
		ok: (value: T) => Ook | PromiseLike<Ook>,
		_err?: (error: E) => Oerr | PromiseLike<Oerr>
	): Future<Result<Ook, Oerr>> {
		return new Future(async (resolve) => {
			try {
				resolve(new Ok(await ok(this._value)) as Result<Ook, Oerr>);
			} catch (error) {
				resolve(new Err(error as Oerr));
			}
		});
	}

	map_err<Oerr>(_err: (error: E) => Oerr): Ok<T, Oerr> {
		return this as unknown as Ok<T, Oerr>;
	}

	map_err_async<Oerr>(
		_err: (error: E) => Oerr | PromiseLike<Oerr>
	): Future<Result<T, Oerr>> {
		return Future.resolve(this) as unknown as Future<Result<T, Oerr>>;
	}
}

export class Err<T = undefined, E = unknown> extends Result<T, E> {
	protected _error: E;

	constructor(error: E) {
		super();
		this._error = error;
	}

	unwrap(): never {
		throw this._error;
	}

	into(): E {
		return this._error;
	}

	map<Ook, Oerr = E>(
		_ok: (value: T) => Ook,
		err?: (error: E) => Oerr
	): Result<Ook, Oerr> {
		if (err) {
			return new Err(err(this._error));
		} else {
			return this as unknown as Result<Ook, Oerr>;
		}
	}

	map_async<Ook, Oerr = E>(
		_ok: (value: T) => Ook | PromiseLike<Ook>,
		err?: (error: E) => Oerr | PromiseLike<Oerr>
	): Future<Result<Ook, Oerr>> {
		return new Future(async (resolve) => {
			try {
				if (err) {
					return new Err(await err(this._error));
				} else {
					return this as unknown as Result<Ook, Oerr>;
				}
			} catch (error) {
				resolve(new Err(error as Oerr));
			}
		});
	}

	map_err<Oerr>(err: (error: E) => Oerr): Result<T, Oerr> {
		return this.map(identity, err);
	}

	map_err_async<Oerr>(
		err: (error: E) => Oerr | PromiseLike<Oerr>
	): Future<Result<T, Oerr>> {
		return this.map_async(identity, err);
	}
}

export default Result;

Object.defineProperties(Result, {
	default: { get: () => Result },
	Result: { get: () => Result },
	Ok: { get: () => Ok },
	Err: { get: () => Err },
});
