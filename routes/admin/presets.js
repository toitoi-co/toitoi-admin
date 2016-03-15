'use strict';

const Promise = require("bluebird");
const rfr = require("rfr");

const apiRouter = rfr("lib/api-router");
const errors = rfr("lib/errors");

const commonParam = rfr("lib/api-common/param");
const commonList = rfr("lib/api-common/list");
const commonCreate = rfr("lib/api-common/create");
const commonLookup = rfr("lib/api-common/lookup");
const commonUpdate = rfr("lib/api-common/update");
const commonDelete = rfr("lib/api-common/delete");

const model = {
	name: "Preset",
	camel: "preset"
}

module.exports = function({bookshelf}) {
	let router = apiRouter();
	let commonState = {bookshelf, model};
	
	router.__param(`${model.camel}Id`, commonParam(commonState));

	router.apiRoute("/", {
		get: commonList(commonState),
		post: commonCreate(commonState)
	});

	router.apiRoute(`/:${model.camel}Id`, {
		get: commonLookup(commonState),
		put: commonUpdate(commonState),
		delete: commonDelete(commonState)
	});
	
	return router;
}