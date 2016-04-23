exports.up = function(knex, Promise) {
	return knex.raw("ALTER TABLE sites ALTER COLUMN \"planId\" DROP NOT NULL");
};

exports.down = function(knex, Promise) {
	return knex.raw("ALTER TABLE sites ALTER COLUMN \"planId\" SET NOT NULL");
};
