'use strict';

const ensureArray = require("../util/ensure-array");

module.exports = function(source, target, events) {
	ensureArray(events).forEach((event) => {
		source.on(event, (...eventArguments) => {
			target.trigger(event, ...eventArguments);
		});
	});
}