'use strict';

module.exports = function(route) {
	let routeSegments = route.split("/").map((segment) => {
		if (segment.charAt(0) === ":") {
			return {
				type: "parameter",
				param: segment.slice(1)
			};
		} else {
			return {
				type: "string",
				value: segment
			};
		}
	});

	return function generate(values) {
		return routeSegments.map((segment) => {
			if (segment.type === "parameter") {
				if (values[segment.param] != null) {
					return values[segment.param];
				} else {
					throw new Error(`Missing value for '${segment.param}' parameter in route`);
				}
			} else if (segment.type === "string") {
				return segment.value;
			}
		}).join("/");
	}
}