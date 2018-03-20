const ccxt = require('ccxt');
const { knex } = require('../database');
const Market = require('../models/market');
const Exchange = require('../models/exchange');
const CurrencyPair = require('../models/currency_pair');

const _ = require('lodash');

ccxt.exchanges.forEach(async (e) => {
  const exchange = new ccxt[e]();
  try {
    await exchange.loadMarkets(true);

    let exchangeId;
    try {
      const record = await Exchange.query().insert({ ccxt_id: e, name: exchange.name }).returning('*');
    } catch (error) {
      // Do nothing
    }

    const record = await Exchange.query().select('id').where({ ccxt_id: e}).first();
    exchangeId = record.id;

    if (exchangeId) {
      await Promise.all(Object.values(exchange.markets).map(async (market) => {
        let currencyPairId;
        try {
          let inserts = await CurrencyPair.query().insert({ quote: market.quote, base: market.base }).returning('*');
          currencyPairId = inserts[0].id;
        } catch (error) {
          const pair = await CurrencyPair.query().where({ quote: market.quote, base: market.base }).first();

          if (!pair) {
            throw Error(`unsupported pair ${market.base}/${market.quote}`);
          }
          currencyPairId = pair.id;
        }
        return Market.query().insert({ symbol: market.symbol, currencyPairId, exchangeId });
      })).catch(error => console.log(error));
    }
  } catch (e) {
    // console.log(e);
  }
});