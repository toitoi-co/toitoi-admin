exports.up = function(knex, Promise) {
	return Promise.all([
		knex.schema.table("sites", function(table) {
			table.timestamp("createdAt", "dateTime");
			table.timestamp("updatedAt", "dateTime");
		}),
		knex.schema.table("plans", function(table) {
			table.timestamp("createdAt", "dateTime");
			table.timestamp("updatedAt", "dateTime");
		})
	]);
};

exports.down = function(knex, Promise) {
	return Promise.all([
		knex.schema.table("sites", function(table) {
			table.dropColumns("createdAt", "updatedAt");
		}),
		knex.schema.table("plans", function(table) {
			table.dropColumns("createdAt", "updatedAt");
		})
	]);
};