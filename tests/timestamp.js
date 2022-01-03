const { timestamp, assert } = require('..');

module.exports = () => {
	assert(timestamp().length === 19);
	assert(timestamp(new Date(), ',', '++').length === 20);
};
