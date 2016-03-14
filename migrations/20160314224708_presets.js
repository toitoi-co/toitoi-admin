exports.up = function(knex, Promise) {
	return knex.schema.createTable("presets", function(table) {
		table.increments('id').primary();
		table.integer('planId').notNullable().references('id').inTable('plans');
		table.boolean('isEnabled').notNullable();
		table.text('name').notNullable();
		table.text('description');
		table.text('thumbnail');
		table.text('url').notNullable();
		table.timestamp('createdAt', 'dateTime');
		table.timestamp('updatedAt', 'dateTime');
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.dropTable("presets");
};