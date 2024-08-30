const { assert, asyncTransform, identity, Future } = require('..');

module.exports = async () => {
	let value = await asyncTransform(
		Promise.resolve(13),
		(value) => value * value
	);

	assert(value === 13 * 13);

	value = await asyncTransform(
		{ then: (resolve) => resolve('foobar') },
		(arg) => [...arg].reverse().join('')
	);

	assert(value === 'raboof');

	let expected = Symbol('error');
	let thrown = undefined;

	try {
		await asyncTransform(undefined, () => Future.reject(expected));
	} catch (e) {
		thrown = e;
	}

	assert(expected === thrown);

	return true;
};
