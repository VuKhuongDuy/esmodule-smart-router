import * as ethers from "ethers";
import {dydxSDK} from "./dydx/services/service.js";
import { KwentaSDK } from "./kwenta/index.js";
import { DYDX_TOKENS, KWENTA_TOKENS, NETWORKS } from "./constants/constants.js";
import {
  checkForNewPosition,
  checkToClosePosition,
  kwentaGetMarket,
} from "./utils/utils.js";
import { IMarkets } from "./interfaces/index.js";

export let kwentaSdk: KwentaSDK;
export let dydxClient: dydxSDK

const init = async () => {
  const provider = new ethers.providers.JsonRpcProvider(NETWORKS.optimism.rpc);
  dydxClient = new dydxSDK();
  dydxClient.initClient()

  kwentaSdk = new KwentaSDK({
    networkId: 10,
    provider,
  });
  await kwentaSdk.prices.startPriceUpdates(30000);
};

/**
 * Get current market data of kwenta, dydx and gmx
 */
const getMarkets = async (tokenIndex: number): Promise<IMarkets> => {
  const kwentaMarket = await kwentaGetMarket(
    KWENTA_TOKENS[tokenIndex],
    kwentaSdk
  );
  const dydxMarket = await dydxClient.getMarket(DYDX_TOKENS[tokenIndex]);

  return {
    kwenta: kwentaMarket,
    dydx: dydxMarket,
    gmx: null,
  };
};

/**
 * Base on funding rate of one pair on markets, make a decision for new position or already position
 */
const reviewContextFundingRate = async (
  markets: IMarkets
) => {
  
  checkForNewPosition(markets);

  checkToClosePosition(markets);
};

const main = async () => {
  await init();

  // setInterval(async () => {
  for (let i = 0; i < DYDX_TOKENS.length; i++) {
    const markets = await getMarkets(i);

    reviewContextFundingRate(markets);
  }
  // }, 30000)
};

main();
