/**
 * Read a property of a record
 *
 * `readRecord`(`{ foo: "bar" }`, `"foo"`) -> `"bar"`
 *
 * @param record the record you want to read from
 * @param key the key which you wish to read
 * @returns `record[key]` or `record` if `record` is not an object
 */
export function readRecord<
	Tkey extends keyof Trecord,
	Tvalue extends Trecord[Tkey],
	Trecord extends Record<Tkey, Tvalue>
>(record: Trecord | undefined, key: Tkey): Trecord[Tkey] | undefined {
	return record?.[key];
}

export default readRecord;

Object.defineProperties(readRecord, {
	default: { get: () => readRecord },
	readRecord: { get: () => readRecord },
});
