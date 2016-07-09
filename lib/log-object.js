'use strict';

const type = require("type-of-is");
const util = require("util");

module.exports = function(object, options) {
	let combinedOptions = Object.assign({depth: null, colors: true}, options);
	return `(${type.string(object)}) ${util.inspect(object, combinedOptions)}`
}