import SerialQueue from './SerialQueue';

export interface ProcedureReport<IT, OT> {
	args: IT;
	output: OT;
}

export interface Procedure<IT extends Array<any>, OT> {
	(...args: IT): OT | Promise<OT>;
}

export class ProceduralQueue<IT extends Array<any>, OT> {
	private _callback: Procedure<IT, OT>;
	private _queue: SerialQueue;
	private _thisArg: object;

	constructor(
		callback: Procedure<IT, OT>,
		error_handler?: (err: Error | unknown) => void,
		thisArg: object = {}
	) {
		this._callback = callback;
		this._queue = new SerialQueue((err) => {
			if (error_handler) {
				error_handler(err);
			} else {
				throw err;
			}
		});
		this._thisArg = thisArg;
	}

	await(...args: IT) {
		return new Promise<ProcedureReport<IT, OT>>((resolve) => {
			this._queue.add(async () =>
				resolve({
					args,
					output: await this._callback.apply(this._thisArg, args),
				})
			);
		});
	}

	add(...tasks: IT[]) {
		for (const task of tasks) {
			this.await(...task);
		}
	}
}

export default ProceduralQueue;

Object.defineProperties(ProceduralQueue, {
	default: { get: () => ProceduralQueue },
	ProceduralQueue: { get: () => ProceduralQueue },
});
