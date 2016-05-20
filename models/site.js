'use strict';

const Promise = require("bluebird");
const checkit = require("checkit");
const uuid = require("uuid");
const rfr = require("rfr");
const util = require("util");

const errors = rfr("lib/errors");
const encodeKey = rfr("lib/firebase/encode-key");
const checkAllowedAttributes = rfr("lib/model/check-allowed-attributes");
const saveValidationHook = rfr("lib/model/save-validation-hook");

module.exports = function({bookshelf, firebase, firebaseAuthenticationPromise, hostedDomain, digitalOcean, deploymentIp, defaultPlanId}) {
	bookshelf.model("Site", {
		tableName: "sites",
		hasTimestamps: ["createdAt", "updatedAt"],
		
		plan: function() {
			return this.belongsTo("Plan", "planId");
		},
		
		owner: function() {
			return this.belongsTo("User", "userId");
		},
		
		preset: function() {
			return this.belongsTo("Preset", "presetId");
		},
		
		defaults: {
			planId: defaultPlanId
		},

		validAttributes: [
			"id",
			"planId",
			"userId",
			"presetId",
			"siteName",
			"subdomainName",
			"domainName",
			"bucketKey",
			"createdAt",
			"updatedAt"
		],
		
		checkAllowedAttributes: checkAllowedAttributes("Preset"),
		
		initialize: function() {
			this.on("saving", saveValidationHook);
			
			this.on("creating", function(model, attributes) {
				model.set({bucketKey: uuid.v4()});
			});
			
			this.on("created", function() {
				/* TODO: Should do insert on Firebase first, but this is not possible because
				 *       Firebase does not offer any kind of exclusive write function.
				 */
				return Promise.try(() => {
					return firebaseAuthenticationPromise;
				}).then(() => {
					return this.createFirebaseItem();
				}).then(() => {
					return this.createDnsEntry();
				});
			});
			
			/* TODO: Should implement a 'destroyed' event as well. */
		},
		
		createFirebaseItem: function() {
			return Promise.try(() => {
				return this.load("owner");
			}).then(() => {
				let primaryDomainName = this.get("subdomainName") + "." + hostedDomain;
				let ownerEmail = this.related("owner").get("email");

				let ownersObject = {};
				ownersObject[encodeKey(ownerEmail)] = ownerEmail;

				console.log(util.inspect(this));
				
				return firebase
					.child(`management/sites/${encodeKey(primaryDomainName)}`)
					.set({
						key: this.get("bucketKey"),
						owners: ownersObject
					});
			});
		},

		createDnsEntry: function(ip) {
			return Promise.try(() => {
				return digitalOcean.domainRecordsCreateAsync(hostedDomain, {
					name: this.get("subdomainName"),
					type: "A",
					data: deploymentIp
				});
			});
		}
	})
}
