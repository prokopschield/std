const { assert, shellEscape } = require('..');

module.exports = function () {
	assert(shellEscape('') === "''");
	assert(shellEscape("'") === `"'"`);
	assert(shellEscape("foo'bar") === `'foo'"'"'bar'`);
};
