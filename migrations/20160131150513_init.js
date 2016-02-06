'use strict';

exports.up = function (knex, Promise) {
	return Promise.all([
		knex.schema.createTable('users', function(table) {
			table.increments('id').primary();
			table.text('email').notNullable().unique();
			table.text('hash').notNullable();
			table.text('role').notNullable().index();
			table.boolean('isActive').notNullable().index();
			table.text('firstName');
			table.text('lastName');
			table.text('address1');
			table.text('address2');
			table.text('city');
			table.text('state');
			table.text('postalCode');
			table.text('country');
			table.timestamp('createdAt', 'dateTime');
			table.timestamp('updatedAt', 'dateTime');
		}),
		knex.schema.createTable('plans', function(table) {
			table.increments('id').primary();
			table.text('name').notNullable();
		})
		/*,
		knex.schema.createTable('packages', function (table) {
			table.increments('id').primary();
			table.text('name').notNullable();
			table.text('description');
			table.text('imageUrl');
			table.boolean('billable').notNullable();
			table.boolean('listed').notNullable();
			table.decimal('priceMonthly');
			table.decimal('priceYearly');
			table.timestamp('createdAt', 'dateTime');
			table.timestamp('updatedAt', 'dateTime');
		}),
		knex.schema.createTable('themes', function (table) {
			table.increments('id').primary();
			table.text('name').notNullable();
			table.text('description');
			table.text('imageUrl');
			// todo: add theme file/archive info (tarfile url and deploy method)
			table.timestamp('createdAt', 'dateTime');
			table.timestamp('updatedAt', 'dateTime');
		})*/
	])
	.then(function () {
		return Promise.all([
			knex.schema.createTable('sites', function(table) {
				table.increments('id').primary();
				table.integer('planId').notNullable().references('id').inTable('plans');
				table.integer('userId').notNullable().references('id').inTable('users');
				table.text('siteName').notNullable();
				table.text('subdomainName').notNullable();
				table.text('domainName').notNullable();
			})
			/*knex.schema.createTable('package_themes', function(table) {
				table.integer('packageId').references('id').inTable('packages');
				table.integer('themeId').references('id').inTable('themes');
			})*/
		])
	})
};

exports.down = function (knex, Promise) {
	return Promise.all([
		knex.schema.dropTableIfExists('sites')
		/*knex.schema.dropTableIfExists('package_themes')*/
	])
	.then(function () {
		return Promise.all([
			knex.schema.dropTableIfExists('users'),
			knex.schema.dropTableIfExists('plans')
			/*
			knex.schema.dropTableIfExists('packages'),
			knex.schema.dropTableIfExists('themes')*/
		]);
	});
};
