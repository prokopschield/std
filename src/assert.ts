/**
 * Assert a condition is true.
 * Throws error if false.
 * @param testcase any value
 * @returns true
 */
export function assert(testcase: any) {
	if (!testcase) throw new Error('Assertion failed.');
	else return true;
}

export default assert;
module.exports = assert;

Object.defineProperties(assert, {
	default: {
		value: assert,
		enumerable: false,
	},
	assert: {
		value: assert,
		enumerable: false,
	},
});
