import * as ethers from "ethers";
import {DydxSDK} from "./dydx/services/service.js";
import { KwentaSDK } from "./kwenta/sdk/index.js";
import { DYDX_TOKENS, KWENTA_PRIVATE_KEY, KWENTA_TOKENS, NETWORKS } from "./constants/constants.js";
import { IMarkets } from "./interfaces/index.js";
import { MarketsResponseObject } from "@dydxprotocol/v3-client";
import { kwentaGetMarket } from "./kwenta/services.js";
import { checkForNewPosition, checkToClosePosition, getPositions } from "./service.js";

export let kwentaSdk: KwentaSDK;
export let dydxClient: DydxSDK

const init = async () => {

  let signer = new ethers.Wallet(KWENTA_PRIVATE_KEY);
  const provider = new ethers.providers.JsonRpcProvider(NETWORKS.optimism.rpc);
  signer = await signer.connect(provider)
  
  kwentaSdk = new KwentaSDK({
    networkId: 10,
    provider,
  });

  kwentaSdk.setSigner(signer)
  await kwentaSdk.prices.startPriceUpdates(30000);
  
  dydxClient = new DydxSDK();
  dydxClient.initClient()
  
};

const getMarkets = async (): Promise<MarketsResponseObject> => {
  const dydxMarkets = await dydxClient.getMarket();
  return dydxMarkets
}

/**
 * Get current market data of kwenta, dydx and gmx
 */
const getMarket = async (dydxMarkets: MarketsResponseObject, tokenIndex: number): Promise<IMarkets> => {
  const kwentaMarket = await kwentaGetMarket(
    KWENTA_TOKENS[tokenIndex],
    kwentaSdk
  );
  const dydxMarket = await dydxClient.getMarketPair(dydxMarkets, DYDX_TOKENS[tokenIndex])

  return {
    kwenta: kwentaMarket,
    dydx: dydxMarket.fundingRate,
    dydxMarkets: dydxMarket.market,
    gmx: null,
  };
};

/**
 * Base on funding rate of one pair on markets, make a decision for new position or already position
 */
const reviewContextFundingRate = async (
  markets: IMarkets
) => {
  
  await checkForNewPosition(markets, kwentaSdk, dydxClient);

  await checkToClosePosition(markets);
};

const main = async () => {
  await init();

  // setInterval(async () => {
  const dydxMarkets = await getMarkets();
  for (let i = 0; i < DYDX_TOKENS.length; i++) {
    console.log('----------------------', DYDX_TOKENS[i], '\t')
    const markets = await getMarket(dydxMarkets, i)

    await getPositions(kwentaSdk, dydxClient, markets);

    await reviewContextFundingRate(markets);
  }
  // }, 30000)
};

main();
