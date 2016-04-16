'use strict';

exports.up = function(knex, Promise) {
	return knex.schema.table("users", function(table) {
		table.boolean("onboardingFlowCompleted").defaultTo(false);
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.table("users", function(table) {
		table.dropColumn("onboardingFlowCompleted");
	});
};
