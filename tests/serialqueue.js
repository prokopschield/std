const { assert } = require('../lib/functions/assert');
const { delay } = require('../lib/functions/delay');
const { SerialQueue } = require('../lib/classes/SerialQueue');

module.exports = async () => {
	const a = new SerialQueue();
	let t = 1;
	a.add(() => assert(t === 1));
	a.add(() => delay(10));
	a.add(() => (t = 2));
	a.add(() => delay(10));
	a.add(() => assert(t === 2));
	a.add(() => delay(10));
	a.add(() => (t = 3));
	a.add(() => delay(10));
	a.add(() => assert(t === 3));
	a.add(() => delay(10));
	a.add(() => (t = 4));
	a.add(() => delay(10));
	a.add(() => assert(t === 4));
	a.add(() => delay(10));
	await a.done;
	assert(a.queue.length === 0);
	assert(!a.working);
	return a.done;
};
