const { assert, delay } = require('..');

module.exports = async () => {
	// force JIT compiler to optimize everything
	for (let i = 0; i < 200; ++i) {
		await delay(1);
		await delay(BigInt(1));
		await delay(String(1));
	}
	for (let i = 0; i < 77; i += 14) {
		let start = Date.now();
		await delay(i);
		let end = Date.now();
		const diff = end - start - i;
		assert(diff < 7);
	}
	for (let i = BigInt(0); i < BigInt(77); i += BigInt(14)) {
		let start = Date.now();
		await delay(i);
		let end = Date.now();
		const diff = end - start - Number(i);
		assert(diff < 7);
	}
	for (let i = 0; i < 77; i += 14) {
		let start = Date.now();
		await delay(String(i));
		let end = Date.now();
		const diff = end - start - i;
		assert(diff < 7);
	}
};
