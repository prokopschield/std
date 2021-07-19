const { assert } = require('..');

module.exports = () => {
	assert(1);
	assert(true);
	try {
		assert(false);
	} catch (error) {
		return true;
	}
	throw new Error('False asserted as true!');
};
