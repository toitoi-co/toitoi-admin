'use strict';

exports.up = function(knex, Promise) {
	return knex.schema.table("users", function(table) {
		table.boolean("signupFlowCompleted");
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.table("users", function(table) {
		table.dropColumn("signupFlowCompleted");
	});
};
