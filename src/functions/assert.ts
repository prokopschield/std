/**
 * Assert a condition is true.
 * Throws error if false.
 * @param testcase any value
 * @returns true
 */
export function assert(
	testcase: any,
	message: string = 'Assertion failed.'
): asserts testcase {
	if (!testcase) throw new Error(message);
	// @ts-ignore
	else return true;
}

export default assert;

Object.defineProperties(assert, {
	default: { get: () => assert },
	assert: { get: () => assert },
});
