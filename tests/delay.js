const { assert, delay } = require('..');

module.exports = async () => {
	for (let i = 0; i < 77; i += 14) {
		let start = Date.now();
		await delay(i);
		let end = Date.now();
		const diff = end - start - i;
		assert(diff < 7);
	}
	for (let i = 0n; i < 77n; i += 14n) {
		let start = Date.now();
		await delay(i);
		let end = Date.now();
		const diff = end - start - +`${i}`;
		assert(diff < 7);
	}
	for (let i = 0; i < 77; i += 14) {
		let start = Date.now();
		await delay(`${i}`);
		let end = Date.now();
		const diff = end - start - i;
		assert(diff < 7);
	}
};
