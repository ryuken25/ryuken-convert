const got = require('got');
const money = require('money');

const FIXER_URL = 'https://api.fixer.io/latest';
const BLOCKCHAIN_URL = 'https://blockchain.info/ticker';
const ETHERCHAIN_URL = 'https://etherchain.org/api/statistics/price';
const DOGECHAIN_URL = 'https://sochain.com/api/v2/get_price/DOGE/USD';

const CURRENCY_BITCOIN = 'BTC';
const CURRENCY_ETHEREUM = 'ETH';
const CURRENCY_DOGECOIN = 'DOGE';

let isAnyBTC = (from, to) => [from, to].includes(CURRENCY_BITCOIN);
let isAnyETH = (from, to) => [from, to].includes(CURRENCY_ETHEREUM);
let isAnyDOGE = (from, to) => [from, to].includes(CURRENCY_DOGECOIN);

const httpOpts = {
  responseType: 'json'
};

module.exports = async (opts) => {
  let {
    amount = 1,
    from = 'USD',
    to = CURRENCY_BITCOIN
  } = opts;

  let base = from;
  let promises = [];

  const anyBTC = isAnyBTC(from, to);
  const anyETH = isAnyETH(from, to);
  const anyDOGE = isAnyDOGE(from, to);

  if (anyBTC) {
    base = (from === CURRENCY_BITCOIN) ? to : from;
    promises.push(got(BLOCKCHAIN_URL, { ...httpOpts, responseType: 'json' }));
  }

  if (anyETH) {
    // always default base to USD when dealing with Ethereum
    base = 'USD';
    promises.push(got(ETHERCHAIN_URL, { ...httpOpts, responseType: 'json' }));
  }

  if (anyDOGE) {
    promises.push(got(DOGECHAIN_URL, { ...httpOpts, responseType: 'json' }));
  }

  promises.unshift(got(`${FIXER_URL}?base=${base}`, { ...httpOpts, responseType: 'json' }));

  try {
    const result = await Promise.all(promises);
    const fixer = result[0].body;

    money.base = fixer.base;
    money.rates = fixer.rates;

    let conversionOpts = {
      from,
      to
    };

    if (anyBTC) {
      const blockchain = result.find(r => r.body.hasOwnProperty(base));
      money.rates.BTC = blockchain.body[base].last;
    }

    if (anyETH) {
      const etherchain = result.find(r => r.body.hasOwnProperty('data') && r.body.status === 1);
      const { usd } = etherchain.body.data[etherchain.body.data.length - 1];
      const ethTo = to === CURRENCY_ETHEREUM ? from : to;
      const eth = money.convert(usd, { from: 'USD', to: ethTo });
      money.base = ethTo;
      money.rates.ETH = eth;
    }

    if (anyDOGE) {
      const dogechain = result.find(r => r.body.data.network === 'DOGE');
      money.rates.DOGE = dogechain.body.data.prices[0].price;
    }

    return money.convert(amount, conversionOpts);
  } catch (error) {
    console.error('Error in currency conversion:', error.message);
    throw error;
  }
};
