'use strict';

const expressPromiseRouter = require("express-promise-router");
const rfr = require("rfr");
const errors = rfr("lib/errors");
const ensureArray = rfr("lib/ensure-array");

module.exports = function() {
	let router = expressPromiseRouter();
	
	router.apiRoute = function(path, routes) {
		function notAllowedHandler(method) {
			return function(req, res) {
				// TODO: Generate Allow header
				let err = new errors.MethodNotAllowedError(`The ${method} method is not supported for this resource.`, {
					acceptedMethods: Object.keys(routes)
				});

				return Promise.reject(err);
			}
		}
		
		["get", "post", "put", "patch", "delete", "head"].forEach((method) => {
			if (routes[method] != null) {
				var routeHandlers = ensureArray(routes[method]);
//			} else if (method === "get") {
//				/* We are required to have a GET method, per HTTP spec. */
//				// TODO: Are we, really?
//				throw new errors.Error(`Missing required ${method} method.`);
			} else if (method === "head") {
				/* Let Express take care of the default behaviour here... */
				return;
			} else {
				var routeHandlers = ensureArray(notAllowedHandler(method));
			}
			
			this[method].apply(this, [path].concat(routeHandlers));
		})
	}
	
	return router;
}