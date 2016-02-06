module.exports = {
	mutable: function(target, source, properties) {
		if (properties == null) {
			properties = Object.keys(source);
		}
		
		properties.forEach((property) => {
			if (source[property] != null) {
				target[property] = source[property];
			}
		});
		
		return target;
	},
	immutable: function(target, source, properties) {
		let base = module.exports.mutable({}, target);
		return module.exports.mutable(base, source, properties);
	}
}