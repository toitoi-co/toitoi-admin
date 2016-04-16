object-lookup
	json-form(route="{opts.route}", method="GET", param-id="{currentId}", useFormParams="true")
		.field
			label ID:
			input(type="text", name="id")
		
	virtual(show="{object != null}")
		h2 Edit object
		object-editor(object="{object}", route="{opts.route}", param-id="{object.id}")
	
	script.
		const Promise = require("bluebird");
		const errors = require("../lib/util/errors");
		const rejectErrors = require("../lib/http/reject-errors");
		
		Object.assign(this, {
			object: null
		})
		
		this.on("mount", () => {
			let form = this.tags["json-form"];
			let editor = this.tags["object-editor"];
			
			form.on("response", (response) => {
				Promise.try(() => {
					return rejectErrors(response);
				}).then((response) => {
					return response.json();
				}).then((json) => {
					this.update({
						object: json
					});
				}).catch(errors.HttpError, (err) => {
					this.trigger("error", err);
				});
			});
			
			form.on("error", (err) => {
				this.trigger("error", err);
			});
			
			editor.on("response", (response) => {
				this.trigger("response", response);
			});
		})