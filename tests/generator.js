const { Generator } = require('..');

module.exports = () => {
	{
		let a = 0;
		let b = 0;
		let c = 1;
		let d = () => {
			a = b;
			b = c;
			c = a + b;
			return c;
		};
		let fibonacci = new Generator(d);
		let n = 2;
		let powers = (function* () {
			while (true) {
				yield (n *= 2);
			}
		})();
		let generator = Generator.join((a, b) => a - b, fibonacci, powers);
		let counter = 0;
		let correct = 37;
		for (const val of generator) {
			if (val > 50000) break;
			else ++counter;
		}
		if (counter !== correct) {
			throw new Error(
				`tests/generator.js failed: [1] ${counter} !== ${correct}`
			);
		}
	}

	{
		const a = function* () {
			let _ = [...Array(20).keys()];
			for (const v of _) {
				yield v * 7;
			}
		};
		const b = function* () {
			let _ = [...Array(20).keys()];
			for (const v of _) {
				yield v * 20;
			}
		};

		const c = [...Generator.join((a, b) => a - b, a(), b())];
		if (c.length !== 40) {
			throw new Error(`tests/generator.js failed: [2] ${c.length}`);
		}
	}
};
