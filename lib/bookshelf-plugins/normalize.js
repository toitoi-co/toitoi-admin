'use strict';

const Promise = require("bluebird");
const util = require("util");
const logObject = require("../log-object");

module.exports = function(bookshelf) {
	bookshelf.Model.normalize = function(value, options = {}) {
		return Promise.try(() => {
			if (typeof value === "object") {
				return value;
			} else {
				let fetchOptions = Object.assign({require: true}, options);
				let forgeProperties = {};

				forgeProperties[this.prototype.idAttribute] = value;

				return this.forge(forgeProperties).fetch(fetchOptions);
			}
		})
	}
}