const Promise = require("bluebird");
const riot = require("riot");
const documentReady = require("document-ready-promise");

require("./components/app.tag");
require("./components/object-editor.tag");
require("./components/object-lookup.tag");
require("./components/tab-list.tag");
require("./components/tab.tag");
require("./components/response-viewer.tag");
require("./components/json-form.tag");

Promise.try(() => {
	return documentReady();
}).then(() => {
	riot.mount("app");
});