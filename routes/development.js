const path = require("path");
const rfr = require("rfr");

const apiRouter = rfr("lib/api-router");

let router = apiRouter();

router.apiRoute("/", {
	get: function(req, res) {
		res.sendFile(path.join(__dirname, "../development/index.html"));
	}
})

module.exports = router;