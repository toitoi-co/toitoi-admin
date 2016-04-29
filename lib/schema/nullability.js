'use strict';

const Promise = require("bluebird");

// TODO: This is all rather broken - primarily because SQLite doesn't understand ALTER COLUMN, and requires complicated juggling of tables to make it happen.
//        Ref: https://stackoverflow.com/a/4007086/1332715

// table.client.config.client -- The driver used.

module.exports = function(knex, table) {
	let tableName = table._tableName;
	
	function makeQuery(columns, operation) {
		if (!Array.isArray(columns)) {
			columns = [columns];
		}
		
		return Promise.map(columns, (column) => {
			return knex.raw("ALTER TABLE " + tableName + " ALTER COLUMN " + column + " " + operation + " NOT NULL")
		});
	}
	
	return {
		nullable: function(columns) {
			return makeQuery(columns, "DROP");
		},
		notNullable: function(columns) {
			return makeQuery(columns, "SET");
		}
	}
}