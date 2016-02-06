'use strict';

const Promise = require("bluebird");
const rfr = require("rfr");

const errors = rfr("lib/errors");

module.exports = function(roleGetter) {
	let roles = {
		guest: {
			name: "guest"
		}
	};
	
	let checkRole = function(requiredRole, actualRole) {
		/* This traverses the role tree. */
		let currentRole = roles[actualRole];
		
		while (currentRole != null) {
			if (currentRole.name === requiredRole) {
				return true;
			}
			
			currentRole = currentRole.parent;
		}
		
		return false;
	}
	
	return {
		addRole: function(roleName, options) {
			roles[roleName] = {
				name: roleName,
				parent: (options.parent != null) ? roles[options.parent] : null
			}
		},
		getRoles: function() {
			return Object.keys(roles).filter(role => (role !== "guest"));
		},
		allow: function(role) {
			return function(req, res, next) {
				if (role === "guest") {
					/* Everybody is allowed on guest routes. */
					next();
				} else {
					Promise.try(() => {
						return roleGetter(req, res);
					}).then((userRole) => {
						if (userRole === "guest") {
							/* User is not logged in. */
							throw new errors.UnauthorizedError("This endpoint requires authentication.");
						} else if (checkRole(role, userRole)) {
							/* User is allowed to view this route. */
							next();
						} else {
							/* User does not have sufficient permissions. */
							throw new errors.ForbiddenError("You do not have sufficient permissions to access this endpoint.");
						}
					}).catch((err) => {
						next(err);
					})
				}
			}
		}
	}
}