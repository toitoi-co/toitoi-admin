exports.up = function(knex, Promise) {
	return knex.schema.table("users", function(table) {
		table.string("confirmationKey");
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.table("users", function(table) {
		table.dropColumn("confirmationKey");
	});
};
