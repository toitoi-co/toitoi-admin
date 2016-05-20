'use strict';

exports.up = function(knex, Promise) {
	return knex.schema.table("users", function(table) {
		table.text("passwordResetKey").nullable();
		table.timestamp("passwordResetExpiry", "dateTime").nullable();
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.table("users", function(table) {
		table.dropColumn("passwordResetKey");
		table.dropColumn("passwordResetExpiry");
	});
};
