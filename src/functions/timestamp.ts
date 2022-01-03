export function timestamp(
	date = new Date(),
	separator_minor = '-',
	separator_major = '_'
) {
	return (
		date.getFullYear().toString() +
		separator_minor +
		('0' + (date.getMonth() + 1)).slice(-2) +
		separator_minor +
		('0' + date.getDate()).slice(-2) +
		separator_major +
		('0' + date.getHours()).slice(-2) +
		separator_minor +
		('0' + date.getMinutes()).slice(-2) +
		separator_minor +
		('0' + date.getSeconds()).slice(-2)
	);
}

export default timestamp;

Object.defineProperties(timestamp, {
	default: { get: () => timestamp },
	timestamp: { get: () => timestamp },
});
