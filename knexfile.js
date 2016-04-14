'use strict';

let config = require("./config.json");

module.exports = {

  client: 'postgresql',
  connection: {
    database: config.database.database,
    user:     config.database.username,
    password: config.database.password
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations'
  }

};
