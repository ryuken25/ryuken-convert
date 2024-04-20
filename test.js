const test = require('ava');
const nock = require('nock');
const currency = require('./index');

test.beforeEach(t => {
  nock('https://api.fixer.io')
    .get('/latest?base=USD')
    .reply(200, {
      base: 'USD',
      rates: {
        DKK: 6.2208,
        EUR: 0.85
      }
    });

  nock('https://api.fixer.io')
    .get('/latest?base=DKK')
    .reply(200, {
      base: 'DKK',
      rates: {
        USD: 0.16075,
        EUR: 0.13
      }
    });

  nock('https://api.fixer.io')
    .get('/latest?base=EUR')
    .reply(200, {
      base: 'EUR',
      rates: {
        USD: 1.18,
        DKK: 7.88
      }
    });

  nock('https://blockchain.info')
    .get('/ticker')
    .reply(200, {
      "USD": { "15m": 3755.12, "last": 3755.12, "buy": 3755.29, "sell": 3754.95, "symbol": "$" },
      "DKK": { "15m": 23383.98, "last": 23383.98, "buy": 23385.04, "sell": 23382.92, "symbol": "kr" },
      "DOGE": { "USD": { "15m": 0.237865, "last": 0.237865, "buy": 0.237865, "sell": 0.237865, "symbol": "$" } }
    });

  nock('https://etherchain.org')
    .get('/api/statistics/price')
    .reply(200, {
      "status": 1,
      "data": [
        {
          "time": "2017-09-23T16:10:56.000Z",
          "usd": 278.91
        }
      ]
    });
});

test('Convert 10 USD to DKK', async t => {
  const converted = await currency({ amount: 10, from: 'USD', to: 'DKK' });
  t.is(converted, 62.208, 'Conversion result is incorrect');
});

test('Convert 1 BTC to USD', async t => {
  const converted = await currency({ amount: 1, from: 'BTC', to: 'USD' });
  t.is(converted, 3755.12, 'Conversion result is incorrect');
});

test('Convert 1 ETH to USD', async t => {
  const converted = await currency({ amount: 1, from: 'ETH', to: 'USD' });
  t.is(converted, 278.91, 'Conversion result is incorrect');
});

test('Convert 100 DKK to USD', async t => {
  const converted = await currency({ amount: 100, from: 'DKK', to: 'USD' });
  t.is(converted, 15.96, 'Conversion result is incorrect');
});

test('Convert 10 EUR to DKK', async t => {
  const converted = await currency({ amount: 10, from: 'EUR', to: 'DKK' });
  t.is(converted, 78.8, 'Conversion result is incorrect');
});

// Add more test cases as needed
