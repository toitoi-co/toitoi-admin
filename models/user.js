'use strict';

const Promise = require("bluebird");
const checkit = require("checkit");
const FirebaseTokenGenerator = require("firebase-token-generator");
const rfr = require("rfr");

const errors = rfr("lib/errors");
const encodeKey = rfr("lib/firebase/encode-key");
const checkAllowedAttributes = rfr("lib/model/check-allowed-attributes");
const saveValidationHook = rfr("lib/model/save-validation-hook");
const parseBooleanFields = rfr("lib/model/parse-boolean-fields");

module.exports = function({bookshelf, acl, firebaseConfiguration, firebase, firebaseAuthenticationPromise}) {
	// FIXME: Pass in tokenGenerator as state
	let tokenGenerator = new FirebaseTokenGenerator(firebaseConfiguration.secret);
	
	bookshelf.model("User", {
		tableName: "users",
		hasTimestamps: ["createdAt", "updatedAt"],
		hidden: ["hash", "confirmationKey"],
		
		// MVP: Assuming a single site for now.
		site: function() {
			return this.hasOne("Site", "userId")
		},

		sites: function() {
			return this.hasMany("Site", "userId");
		},
		
		defaults: {
			isActive: true,
			signupFlowCompleted: true,
			onboardingFlowCompleted: false
		},
		
		parse: function(attributes) {
			return parseBooleanFields(attributes, ["isActive", "signupFlowCompleted", "onboardingFlowCompleted"]);
		},
		
		validAttributes: [
			"id",
			"email",
			"hash",
			"role",
			"isActive",
			"signupFlowCompleted",
			"onboardingFlowCompleted",
			"confirmationKey",
			"firstName",
			"lastName",
			"address1",
			"address2",
			"city",
			"state",
			"postalCode",
			"country",
			"createdAt",
			"updatedAt"
		],
		
		// FIXME: Detect 'UNIQUE constraint failed' errors, and throw accordingly
		validationRules: checkit({
			email: "email",
			isActive: "boolean",
			signupFlowCompleted: "boolean",
			onboardingFlowCompleted: "boolean",
			role: ["required", (val) => {
				if (acl.getRoles().indexOf(val) === -1) {
					throw new errors.ValidationError("The specified role does not exist.")
				}
			}]
		}),
		
		checkAllowedAttributes: checkAllowedAttributes("User"),
		
		initialize: function() {
			this.on("saving", saveValidationHook);
			
			this.on("created", function() {
				/* FIXME: Should do insert on Firebase first, but this is not possible because
				 *        Firebase does not offer any kind of exclusive write function.
				 */
				return Promise.try(() => {
					return firebaseAuthenticationPromise;
				}).then(() => {
					return firebase
						.child(`management/users/${encodeKey(this.get("email"))}/exists`)
						.set(true);
				});
			});
			
			/* FIXME: Should implement a 'destroyed' event as well, but need to investigate
			 * how to integrate this with actual site removal and such, and whether making
			 * this happen upon removing the User model is really the right way to go.
			 */
		},
		
		getFirebaseToken: function(options) {
			return tokenGenerator.createToken({
				uid: `local:${this.get("id")}`,
				email: this.get("email"),
				provider: "admin-api"
			}, options);
		},
		
		/* TEMPORARY: The following only applies to the MVP, where each user can have exactly one site. */
		getPrimarySite: function() {
			return Promise.try(() => {
				return this.load("sites");
			}).then(() => {
				let sites = this.related("sites");
				
				if (sites.length > 0) {
					return sites.at(0);
				} // FIXME: Throw an Error if the user has no sites?
			})
		},
		getPlan: function() {
			return Promise.try(() => {
				return this.getPrimarySite();
			}).then((site) => {
				if (site != null) {
					return Promise.try(() => {
						return site.load("plan");
					}).then(() => {
						return site.related("plan");
					});
				}
			});
		}
	})
}
