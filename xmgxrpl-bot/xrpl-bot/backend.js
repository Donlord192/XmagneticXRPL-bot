const xrpl = require("xrpl");

let client = null;
let wallet = null;
let running = false;

async function connectXRPL(seed){

  client = new xrpl.Client(
 "wss://xrplcluster.com"
);

  await client.connect();

  wallet = xrpl.Wallet.fromSeed(seed);

  return wallet.classicAddress;
}

// Получаем стакан

async function getBook(currency, issuer){

  const res = await client.request({
    command: "book_offers",

    taker_gets: {
      currency: "XRP"
    },

    taker_pays:{
      currency: currency,
      issuer: issuer
    }
  });

  return res.result.offers || [];
}

// Отмена ордеров

async function cancelAll(){

  const offers = await client.request({
    command:"account_offers",
    account: wallet.classicAddress
  });

  for(const o of offers.result.offers){

    await client.submit({
      TransactionType:"OfferCancel",
      Account: wallet.classicAddress,
      OfferSequence:o.seq
    },{wallet});
  }
}

// Создание ордера

async function placeBuy(xrp, price, currency, issuer){

  await client.submit({

    TransactionType:"OfferCreate",

    Account: wallet.classicAddress,

    TakerGets: xrpl.xrpToDrops(xrp),

    TakerPays:{
      currency,
      issuer,
      value:(xrp*price).toFixed(6)
    }

  },{wallet});
}

module.exports = {
  connectXRPL,
  getBook,
  cancelAll,
  placeBuy
};
