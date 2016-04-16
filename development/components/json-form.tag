json-form
	form(onsubmit="{_handleSubmit}")
		!= "<yield />"
		button(type="Submit") Send
		
	script.
		const Promise = require("bluebird");
		const serialize = require("form-serialize");
		const parseRoute = require("../lib/route/parse");
		const parseParams = require("../lib/route/params");
		const defaultValue = require("../lib/util/default-value");
		
		Object.assign(this, {
			_handleSubmit: function(event) {
				Promise.try(() => {
					let form = this.root.querySelector("form");
					
					let serialized = serialize(form, {hash: true});
					
					this.trigger("pending");
					
					let method = defaultValue(opts.method, "GET");
					let route = parseRoute(opts.route);
					let params = Object.assign(parseParams(opts), opts.extraParams);
					let body;
					
					if (opts.useFormParams) {
						Object.assign(params, serialized);
					} else if (["POST", "PUT", "PATCH"].indexOf(method) !== -1) {
						body = JSON.stringify(serialized);
					}
					
					let url = route(params);
					
					return window.fetch(url, {
						headers: new Headers({
							"Content-Type": "application/json"
						}),
						method: method,
						credentials: "include",
						body: body
					});
				}).then((response) => {
					this.trigger("response", response);
				});
			}
		})