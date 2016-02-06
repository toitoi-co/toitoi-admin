'use strict';

const Promise = require("bluebird");
const checkit = require("checkit");
const FirebaseTokenGenerator = require("firebase-token-generator");
const rfr = require("rfr");

const errors = rfr("lib/errors");
const encodeKey = rfr("lib/firebase/encode-key");

module.exports = function({bookshelf, acl, firebaseConfiguration, firebase}) {
	// FIXME: Pass in tokenGenerator as state
	let tokenGenerator = new FirebaseTokenGenerator(firebaseConfiguration.secret);
	
	bookshelf.model("User", {
		tableName: "users",
		hasTimestamps: ["createdAt", "updatedAt"],
		hidden: ["hash"],
		
		defaults: {
			isActive: true
		},
		
		parse: function(attributes) {
			if (attributes.isActive != null) {
				attributes.isActive = !!(attributes.isActive);
			}
			
			return attributes;
		},
		
		validAttributes: [
			"id",
			"email",
			"hash",
			"role",
			"isActive",
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
			role: ["required", (val) => {
				if (acl.getRoles().indexOf(val) === -1) {
					throw new errors.ValidationError("The specified role does not exist.")
				}
			}]
		}),
		
		checkAllowedAttributes: function() {
			Object.keys(this.attributes).forEach((attribute) => {
				if (this.validAttributes.indexOf(attribute) === -1) {
					throw new errors.ValidationError(`'${attribute}' is not an allowed attribute on User models.`)
				}
			});
		},
		
		initialize: function() {
			this.on("saving", function() {
				return Promise.all([
					this.validationRules.run(this.attributes),
					this.checkAllowedAttributes()
				]).catch(checkit.Error, (err) => {
					throw new errors.ValidationError("One or more fields were invalid.", {errors: err.errors})
				});
			});
			
			this.on("created", function() {
				/* FIXME: Should do insert on Firebase first, but this is not possible because
				 *        Firebase does not offer any kind of exclusive write function.
				 */
				return Promise.try(() => {
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
		}
	})
}