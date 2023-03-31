const { assert, CounterMap } = require('..');

module.exports = async () => {
	const map = new CounterMap();

	assert(map.get('foo') === 0);
	assert(map.increment('foo') === 1);
	assert(map.increment('foo') === 2);
	assert(map.decrement('foo') === 1);
	assert(map.increment('foo') === 2);
	assert(map.reset('foo') === 0);
	assert(map.decrement('foo') === -1);
	assert(map.increment('foo') === 0);
	assert(map.increment('foo') === 1);
	assert(map.increment('foo') === 2);
};
