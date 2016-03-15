exports.up = function(knex, Promise) {
	return knex.schema.table("sites", function(table) {
		table.string("bucketKey"); // FIXME: This should be notNullable, but apparently SQLite is incapable of dealing with that.
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.table("sites", function(table) {
		table.dropColumn("bucketKey");
	});
};
