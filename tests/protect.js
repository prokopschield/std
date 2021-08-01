const { assert } = require('..');
const { protect } = require('..');

module.exports = function () {
	const a = class Foo {
		constructor() {}
		static statfn() {}
		dynfn() {}
	};
	const b = function Bar() {
		return a;
	};
	const c = {};
	const A = protect(a);
	const B = protect(b);
	const C = protect(c);
	assert(B() !== a);
	assert(!new A().dynfn());
	assert(delete A.statfn);
	assert(a.statfn);
	assert(delete a.statfn);
	assert(!a.statfn);
	assert((c.foo = 'bar'));
	assert(C.foo === 'bar');
	assert(Object.getOwnPropertyDescriptor(C, 'foo'));
	assert(Object.getPrototypeOf(C));
	assert((C.fizz = 'barr'));
	assert('fizz' in C);
	assert(!('fizz' in c));
	assert(
		Object.getOwnPropertyNames(C).length > Object.getOwnPropertyNames(c).length
	);
	assert(Object.setPrototypeOf(B, A));
	assert(Object.getPrototypeOf(B) === A);
	assert(Object.getPrototypeOf(B) !== a);
	assert(Object.getPrototypeOf(b) !== A);
	assert(Object.getPrototypeOf(b) !== a);
	assert(Object.isExtensible(C));
	Object.preventExtensions(C);
	assert(!Object.isExtensible(C));
	/*
		// Failed to implement this.

		assert(Object.isExtensible(c));
		Object.preventExtensions(c);
		assert(!Object.isExtensible(C));
		assert(!Object.isExtensible(c));
	*/
	let f = {
		fizz: 'buzz',
	};
	let g = { f };
	let h = protect(g);
	let hf = h.f;
	hf.foo = 'bar';
	let { foo } = hf;
	assert(foo === 'bar');
	assert(f.fizz === 'buzz');
	assert(!('foo' in f));
	assert(g.f === f);
	assert(h !== g);
	assert(h.f !== f);
	/** Assert both are undefined */
	assert(h.f.foo === g.f.foo);
	assert(hf.foo && hf.fizz);
	/** Assert a new Proxy is generated each time */
	assert(hf !== h.f);
};
