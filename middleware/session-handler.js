const Promise = require("bluebird");

module.exports = function({bookshelf}) {
	return function(req, res, next) {
		Promise.try(() => {
			if (req.session.userId != null) {
				res.header("X-API-Authenticated", "true");
				// FIXME: What if the user has been deleted?
				return bookshelf.model("User").forge({id: req.session.userId}).fetch({require: true});
			} else {
				res.header("X-API-Authenticated", "false");
				return null;
			}
		}).then((user) => {
			req.currentUser = user;
			next();
		}).catch((err) => {
			/* We don't have express-promise-router here, so we need to propagate
			 * errors to the error handling middleware manually.
			 */
			next(err);
		})
	}
}