const { Model } = require('../database');

class Order extends Model {
  static get tableName() {
    return 'orders';
  }

  static get timestamp() {
    return true;
  }

  static get relationMappings() {
    return {
      market: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/market`,
        join: {
          from: 'orders.marketId',
          to: 'markets.id'
        }
      }
    };
  }

  update() {
    this.market.exchange;
  }
}

module.exports = Order;
