exports.up = function(knex, Promise) {
	return knex.raw("CREATE UNIQUE INDEX unique_subdomain ON sites USING btree (\"subdomainName\")");
};

exports.down = function(knex, Promise) {
	return knex.raw("DROP INDEX unique_subdomain");
};