'use strict';

module.exports = {
	users: [{
		name: "email",
		description: "E-mail address"
	}, {
		name: "password",
		description: "Password"
	}, {
		name: "isActive",
		description: "isActive",
		default: "true"
	}, {
		name: "role",
		description: "Role",
		default: "member"
	}, {
		type: "divider"
	}, {
		name: "firstName",
		description: "First name"
	}, {
		name: "lastName",
		description: "Last name"
	}, {
		name: "address1",
		description: "Address line 1"
	}, {
		name: "address2",
		description: "Address line 2"
	}, {
		name: "postalCode",
		description: "Postal code"
	}, {
		name: "city",
		description: "City"
	}, {
		name: "state",
		description: "State"
	}, {
		name: "country",
		description: "Country"
	}],
	sites: [{
		name: "planId",
		description: "Plan ID"
	}, {
		name: "userId",
		description: "User ID"
	}, {
		type: "divider"
	}, {
		name: "siteName",
		description: "Site name (title)"
	}, {
		name: "subdomainName",
		description: "Subdomain (without domain)"
	}, {
		name: "domainName",
		description: "Custom domain"
	}],
	presets: [{
		name: "planId",
		description: "Plan ID"
	}, {
		name: "isEnabled",
		description: "Enabled (boolean)",
		default: "true"
	}, {
		type: "divider"
	}, {
		name: "name",
		description: "Name"
	}, {
		name: "description",
		description: "Description"
	}, {
		name: "url",
		description: "URL"
	}, {
		name: "thumbnail",
		description: "Thumbnail URL"
	}],
	plans: [{
		name: "name",
		description: "Plan name"
	}]
}