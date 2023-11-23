/**
 * Generate a handle (username) from any string (display name)
 * @param input display name
 * @param length maximum output length
 * @returns the shortened string
 * @warning diacritic filtering may be modified in a patch version
 */
export function filterUsername(
	input: string,
	length = 16,
	replacement = ''
): string {
	return input
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[ǎáâàäåāĀăĂȧạảấầẩẫậǍÁÂÀÄÅĀĀĂȦẠẢẤẦẨẪẬ]/g, 'a')
		.replace(/[čćĉċçČćĉċÇçčćĉċçčćĉċÇçČĆĈĊ]/g, 'c')
		.replace(/[ďđĎďďĎđĐđĐđĎĎĐĐ]/g, 'd')
		.replace(/[ěéêèëěéêèëĚéêèëĚéêèëĚÉÊÈËĚÉÊÈË]/g, 'e')
		.replace(/[ǐíîìïįį́ȉıǏÍÎÌÏĮĮ́ȈI]/g, 'i')
		.replace(/[ľĺļłĽĺļŁłĽĹĻŁ]/g, 'l')
		.replace(/[ňńņñŇňŅņÑñǹňňŇŅŅÑÑǸŇŇ]/g, 'n')
		.replace(/[ǒóôòöøǒóôòöøǫộơƠǑÓÔÒÖØǑÓÔÒÖØǪỘƠ]/g, 'o')
		.replace(/[řŕŗŘřŔŕŖŗŘŔŖ]/g, 'r')
		.replace(/[šśŝşŠšŚśŜŝŞşŠŚŜŝŞŞ]/g, 's')
		.replace(/[ťțȚțţŤţŢŤȚȚŢ]/g, 't')
		.replace(/[ǔúûùüǜǚǘǖůǔúûùüǜǚǘǖựǓÚÛÙÜǛǙǗǗŮǓÚÛÙÜǛǚǘǖỰ]/g, 'u')
		.replace(/[ýÿȳÝýŸÿÝŸȲ]/g, 'y')
		.replace(/[žźżŽžŹźŻżẓŽŹŻẒ]/g, 'z')
		.replace(/[ẞß]/g, 'ss')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim()
		.slice(0, length)
		.trim()
		.replace(/ +/g, replacement);
}

export default filterUsername;

Object.defineProperties(filterUsername, {
	default: { get: () => filterUsername },
	filterUsername: { get: () => filterUsername },
});
