/* CAUTION: Mutates the `attributes` object! */

module.exports = function(attributes, booleanFields) {
	booleanFields.forEach((attribute) => {
		if (attributes[attribute] != null) {
			attributes[attribute] = !!(attributes[attribute]);
		}
	});
	
	return attributes;
}