exports.up = knex => knex.schema.createTable('order_caddies_trigger_markets', (table) => {
    table.bigIncrements().primary();
    table.enum('side', ['buy', 'sell']).notNullable();
    table.bigInteger('order_caddies_id').references('id').inTable('order_caddies').index();
    table.bigInteger('market_id').references('id').inTable('markets').index();
  });

exports.down = knex =>  knex.schema.dropTableIfExists('order_caddies_trigger_markets');
