exports.up = function(knex, Promise) {
	return knex.schema.table("users", function(table) {
		table.integer("failedLoginAttempts").notNullable().default(0);
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.table("users", function(table) {
		table.dropColumn("failedLoginAttempts");
	})
};
