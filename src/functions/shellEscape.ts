/**
 * shell-escapes a string
 * @param string input_string
 * @returns 'input_string'
 */
export function shellEscape(string: string) {
	return `'${string.replace(/'/g, `'"'"'`)}'`.replace(/''/g, '') || "''";
}

export default shellEscape;

Object.defineProperties(shellEscape, {
	default: { get: () => shellEscape },
	shellEscape: { get: () => shellEscape },
});
