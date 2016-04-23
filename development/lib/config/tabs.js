'use strict';

module.exports = [{
	name: "User",
	categories: [{
		name: "Authentication",
		items: [{
			name: "Register",
			tabName: "register"
		}, {
			name: "Confirm e-mail address",
			tabName: "confirm-email"
		}, {
			name: "Login",
			tabName: "login"
		}, {
			name: "Change password",
			tabName: "change-password"
		}, {
			name: "Generate Firebase token",
			tabName: "token"
		}, {
			name: "Log out",
			tabName: "logout"
		}]
	}, {
		name: "Profile",
		items: [{
			name: "Get",
			tabName: "profile-get"
		}, {
			name: "Modify",
			tabName: "profile-set"
		}]
	}, {
		name: "Site",
		items: [{
			name: "Get",
			tabName: "site-get"
		}, {
			name: "Modify / Create",
			tabName: "site-set"
		}]
	}, {
		name: "Presets",
		items: [{
			name: "List",
			tabName: "presets"
		}]
	}, {
		name: "Signed requests",
		items: [{
			name: "Change preset",
			tabName: "signed-request-preset"
		}]
	}]
}, {
	name: "Admin-only",
	categories: [{
		name: "Roles",
		items: [{
			name: "List",
			tabName: "admin-roles"
		}]
	}].concat(["Users", "Plans", "Sites", "Presets"].map((model) => {
		return {
			name: model,
			items: [{
				name: "List",
				tabName: `admin-${model.toLowerCase()}-list`
			}, {
				name: "Create",
				tabName: `admin-${model.toLowerCase()}-create`
			}, {
				name: "Lookup / Modify",
				tabName: `admin-${model.toLowerCase()}-modify`
			}]
		};
	}))
}]