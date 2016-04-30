exports.up = function(knex, Promise) {
	return knex.schema.table("sites", function(table) {
		table.integer("presetId");
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.table("sites", function(table) {
		table.dropColumn("presetId");
	});
};
