object-editor
	json-form(route="{opts.route}", method="PUT", param-id="{opts.paramId}")
		div.field(each="{key, value in parent.opts.object}")
			virtual(if="{parent.parent.isPrimitive(value)}")
				label {key}
				input(type="text", name="{key}", value="{value}")

	script.
		const type = require("type-of-is");
		const forward = require("../lib/events/forward");
		
		Object.assign(this, {
			isPrimitive: function(value) {
				let validTypes = ["String", "Number", "Boolean", "null", "undefined"];
				return (validTypes.indexOf(type.string(value)) !== -1);
			}
		})
		
		this.on("mount", () => {
			let form = this.tags["json-form"];
			forward(form, this, ["error", "response"]);
		});