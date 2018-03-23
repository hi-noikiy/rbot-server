const { Model } = require('../database');

class CurrencyPair extends Model {
  static get tableName() {
    return 'currency_pairs';
  }

  static get virtualAttributes() {
    return ['label'];
  }

  static get timestamp() {
    return false;
  }

  get label() {
    return `${this.base}/${this.quote}`;
  }

  static get relationMappings() {
    return {
      markets: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/market`,
        join: {
          from: 'currency_pairs.id',
          to: 'markets.currencyPairId'
        }
      }
    };
  }
}

module.exports = CurrencyPair;
