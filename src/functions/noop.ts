/** This function does nothing. */
export function noop() {
	// nothing to do
}

export default noop;

Object.defineProperties(noop, {
	default: { get: () => noop },
	noop: { get: () => noop },
});
