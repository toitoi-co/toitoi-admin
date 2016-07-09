const Promise = require("bluebird");
const checkit = require("checkit");
const rfr = require("rfr");

const apiRouter = rfr("lib/api-router");
const errors = rfr("lib/errors");

module.exports = function({stripe}) {
	let router = apiRouter();

	router.apiRoute("/stripe-webhook", {
		post: function (req, res) {
			return Promise.try(() => {
				return checkit({
					id: ["required", "string"]
				}).run(req.body);
			}).then(() => {
				return stripe.events.retrieve(req.body.id);
			}).then((event) => {
				switch (event.type) {
					/* Webhook handlers will go here in the future. */
					default:
						res.status(200);
						break;
				}
			})
		}
	})

	return router;
}