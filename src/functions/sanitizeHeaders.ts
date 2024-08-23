/**
 * Normalizes header keys, e.g. "content-type" to "Content-Type"
 * @param record any headers object you wish to normalize
 * @param replacementCharacter e.g. '_' to change "Content-Type" to "Content_Type"
 * @param filter_regexp undesirable characters, e.g. /[^a-z]+/g
 * @returns a new object (inputs are not mutated)
 */
export function sanitizeHeaders(
	record: Record<string, any>,
	replacementCharacter = '-',
	filter_regexp = /[^a-z\d]+/g
): Record<string, string> {
	const out: Record<string, string> = {};

	for (const [key, value] of Object.entries(record)) {
		let keyFiltered = String(key).toLowerCase();
		keyFiltered = ' ' + keyFiltered.replace(filter_regexp, ' ');
		for (const match of keyFiltered.match(/ ./g) || []) {
			keyFiltered = keyFiltered.replace(match, match.toUpperCase());
		}
		keyFiltered = keyFiltered.trim().replace(/ +/g, replacementCharacter);
		if (keyFiltered) {
			out[keyFiltered] = String(value);
		}
	}

	return out;
}

export default sanitizeHeaders;

Object.defineProperties(sanitizeHeaders, {
	default: { get: () => sanitizeHeaders },
	sanitizeHeaders: { get: () => sanitizeHeaders },
});
