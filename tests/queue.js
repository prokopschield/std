const { Queue } = require('..');

module.exports = async () => {
	const queue = new Queue();
	await queue.promise;
	queue.next();
	await queue.promise;
	queue.next();
	setTimeout(() => queue.next());
	await queue.promise;
	await queue.promise;
	return queue.working;
};
