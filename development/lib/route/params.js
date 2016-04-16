'use strict';

module.exports = function(opts = {}) {
	let paramOpts = {};

	Object.keys(opts).forEach((key) => {
		if (key.slice(0, 5) === "param") {
			let decamelizedKey = key.slice(5).replace(/^\w/, (char) => char.toLowerCase())
			paramOpts[decamelizedKey] = opts[key];
		}
	});

	return paramOpts;
}