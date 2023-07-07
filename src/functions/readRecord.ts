/**
 * Read a property of a record, or return the first argument
 *
 * `readRecord`(`{ foo: "bar" }`, `"foo"`) -> `"bar"`
 * `readRecord`(`"bar"`, `"foo"`) -> `"bar"`
 *
 * @param record the record you want to read from
 * @param key the key which you wish to read
 * @returns `record[key]` or `record` if `record` is not an object
 */
export function readRecord<
	Tkey extends keyof Trecord,
	Tvalue extends Trecord[Tkey],
	Trecord extends Record<Tkey, Tvalue>
>(record: Trecord, key: Tkey): Trecord[Tkey] {
	if (record && typeof record === 'object') {
		return record[key];
	}

	return record;
}

export default readRecord;

Object.defineProperties(readRecord, {
	default: { get: () => readRecord },
	readRecord: { get: () => readRecord },
});
