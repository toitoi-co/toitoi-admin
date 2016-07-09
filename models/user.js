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

module.exports = function({bookshelf, acl, firebaseConfiguration, firebase, firebaseAuthenticationPromise, firebaseTokenGenerator, stripeAPI}) {
	bookshelf.model("User", {
		tableName: "users",
		hasTimestamps: ["createdAt", "updatedAt"],
		hidden: ["hash", "confirmationKey", "passwordResetKey", "stripeCustomerId", "stripeSubscriptionId"],
		
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
			onboardingFlowCompleted: false,
			hasStripeToken: false
		},
		
		parse: function(attributes) {
			return parseBooleanFields(attributes, ["isActive", "signupFlowCompleted", "onboardingFlowCompleted", "hasStripeToken"]);
		},
		
		validAttributes: [
			"id",
			"email",
			"hash",
			"role",
			"isActive",
			"signupFlowCompleted",
			"onboardingFlowCompleted",
			"hasStripeToken",
			"stripeCustomerId",
			"stripeSubscriptionId",
			"confirmationKey",
			"passwordResetKey",
			"passwordResetExpiry",
			"failedLoginAttempts",
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
				/* TODO: Should do insert on Firebase first, but this is not possible because
				 *       Firebase does not offer any kind of exclusive write function.
				 */
				return Promise.try(() => {
					return firebaseAuthenticationPromise;
				}).then(() => {
					return firebase
						.child(`management/users/${encodeKey(this.get("email"))}/exists`)
						.set(true);
				});
			});
			
			/* TODO: Should implement a 'destroyed' event as well, but need to investigate
			 * how to integrate this with actual site removal and such, and whether making
			 * this happen upon removing the User model is really the right way to go.
			 */
		},
		
		getFirebaseToken: function(options) {
			return firebaseTokenGenerator.createToken({
				uid: `local:${this.get("id")}`,
				email: this.get("email"),
				provider: "admin-api"
			}, options);
		},
		
		hasPaymentInformation: function() {
			return !!(this.get("hasStripeToken"));
		},

		subscribeToPlan: function(plan) {
			return Promise.try(() => {
				return stripeAPI.subscriptions.list({
					customer: this.get("stripeCustomerId")
				});
			}).then((subscriptions) => {
				if (subscriptions.data.length > 0) {
					/* Switch the subscription to a different plan.
					 * TEMPORARY: Assume a single subscription per user for now. */
					let subscription = subscriptions.data[0];

					return stripeAPI.subscriptions.update(subscription.id, {
						plan: plan.get("stripePlanId")
					});
				} else {
					return stripeAPI.subscriptions.create({
						customer: this.get("stripeCustomerId"),
						plan: plan.get("stripePlanId")
					});
				}
			});
		},

		/* TEMPORARY: The following only applies to the MVP, where each user can have exactly one site. */
		getPrimarySite: function() {
			return Promise.try(() => {
				return this.load("sites");
			}).then(() => {
				let sites = this.related("sites");
				
				if (sites.length > 0) {
					return sites.at(0);
				} // TODO: Throw an Error if the user has no sites?
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
