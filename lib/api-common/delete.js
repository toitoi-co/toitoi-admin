'use strict';

const Promise = require("bluebird");
const rfr = require("rfr");

module.exports = function({bookshelf, model}) {
	return function(req, res) {
		return Promise.try(() => {
			return req[`params${model.name}`].destroy({require: true});
		}).then((item) => {
			res.status(204).end();
		}).catch(bookshelf.Model.NoRowsDeletedError, (err) => {
			/* This should only happen in the case of a race condition, where the item was deleted
			 * inbetween the execution of the `${model.name}Id` parameter handler and the `destroy` call.
			 * FIXME: Investigate possible causes for this error, and whether different types of
			 *        errors / status codes might be necessary.
			 */
			throw new errors.ConflictError(`Could not delete the ${model.name}, it was most likely already deleted.`)
		})
	}
}