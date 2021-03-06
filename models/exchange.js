const { Model } = require('../database');
const ccxt = require('ccxt');
const _ = require('lodash');
const proxies = (process.env.PROXIES || '').split(',').filter(p => !!p).map(p => `http://${p}:8080/`);
const store = require('node-persist');
const assert = require('assert');
const { precisionRound, wait } = require('../utils');

store.init();

class Exchange extends Model {
  static get tableName() {
    return 'exchanges';
  }

  loadRequirements() {
    this.lazyLoadCcxt();
    this.requires = this.instance.requiredCredentials;
  }

  static get timestamp() {
    return false;
  }

  static get relationMappings() {
    return {
      markets: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/market`,
        join: {
          from: 'exchanges.id',
          to: 'markets.exchangeId'
        }
      },
      settings: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/exchange_settings`,
        join: {
          from: 'exchanges.id',
          to: 'exchange_settings.exchangeId'
        }
      },
      apiCalls: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/api_call`,
        join: {
          from: 'exchanges.id',
          to: 'api_calls.exchange_id'
        }
      }
    };
  }

  get ccxt() {
    this.lazyLoadCcxt();
    this.cycleProxy();
    return this.instance;
  }

  lazyLoadCcxt() {
    if (!this.instance) {
      const ccxtId = this.ccxtId;
      // wrap in a proxy and stagger if needed (for example independentreserve)
      this.instance =  new Proxy(new ccxt[this.ccxtId]({ verbose: false, timeout: 20000 }), {
        get(obj, prop) {
          let stagger = null;
          if (/private/.exec(prop.toString()) && obj[prop]) {
            let nextCallAllowedAt = store.getItemSync(ccxtId + '-privatecall');
            const now = new Date().getTime();
            nextCallAllowedAt = nextCallAllowedAt > now ?  nextCallAllowedAt + 1010 : now + 1010;
            store.setItemSync(ccxtId + '-privatecall', nextCallAllowedAt);
            if (nextCallAllowedAt) {
              stagger = async(...args) => {
                const millisToWait = new Date(nextCallAllowedAt).getTime() - new Date().getTime();
                await wait(millisToWait > 0 ? millisToWait : 0);
                return obj[prop](...args);
              };
            }
          }
          return stagger || obj[prop];
        }
      });
    }
  }

  set userSettings(settings) {
    this.lazyLoadCcxt();
    Object.assign(this.instance, _.pick(settings, ['apiKey', 'secret', 'uid', 'password']));
  }

  get has() {
    this.lazyLoadCcxt();
    return this.instance.has;
  }

  cycleProxy() {
    if (proxies.length) {
      const index = store.getItemSync(this.ccxtId) || 0;
      this.instance.proxy = proxies[index % proxies.length];
      store.setItemSync(this.ccxtId, index + 1);
    }
  }

  $formatJson(json) {
    return _.omit(json, ['ccxt', 'instance', 'userSettings']);
  }

  async createOrder(order) {
    assert(order.symbol
      && ['buy', 'sell'].includes(order.side)
      && ['limit', 'market'].includes(order.type)
      && order.amount,  'Order invalid');

    const response = await this.ccxt.createOrder(order.symbol, order.type, order.side,
      order.amount, order.limitPrice && precisionRound(order.limitPrice, 6));

    order.timestamp = new Date();
    order.orderId = response.id;
    return order;
  }
}

module.exports = Exchange;
