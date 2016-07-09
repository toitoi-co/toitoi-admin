exports.up = function(knex, Promise) {
	return Promise.all([
		knex.schema.table("users", function(table) {
			table.boolean("hasStripeToken").notNullable().default(false);
			table.text("stripeCustomerId");
			table.text("stripeSubscriptionId");
		}),
		knex.schema.table("plans", function(table) {
			table.integer("stripePlanId");
		})
	]);
};

exports.down = function(knex, Promise) {
	return Promise.all([
		knex.schema.table("users", function(table) {
			table.dropColumn("hasStripeToken");
			table.dropColumn("stripeCustomerId");
			table.dropColumn("stripeSubscriptionId");
		}),
		knex.schema.table("plans", function(table) {
			table.dropColumn("stripePlanId");
		})
	]);
};
