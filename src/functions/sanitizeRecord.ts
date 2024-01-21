/**
 * Filters malicious input from object keys.
 * @param record any object you wish to normalize
 * @param replacementCharacter e.g. '_' to change "content-type" to "content_type"
 * @param filter_regexp undesirable characters, e.g. /[^a-z]+/g
 * @returns a new object (inputs are not mutated)
 */
export function sanitizeRecord(
	record: Record<string, any>,
	replacementCharacter = '-',
	filter_regexp = /[^a-z]+/g
): Record<string, string> {
	const out: Record<string, string> = {};

	for (const [key, value] of Object.entries(record)) {
		const keyFiltered = String(key)
			.toLowerCase()
			.replace(filter_regexp, ' ')
			.trim()
			.replace(/ +/g, replacementCharacter);
		if (keyFiltered) {
			out[keyFiltered] = String(value);
		}
	}

	return out;
}

export default sanitizeRecord;

Object.defineProperties(sanitizeRecord, {
	default: { get: () => sanitizeRecord },
	sanitizeRecord: { get: () => sanitizeRecord },
});
