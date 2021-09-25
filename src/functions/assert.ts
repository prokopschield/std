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

Object.defineProperties(assert, {
	default: { get: () => assert },
	assert: { get: () => assert },
});
