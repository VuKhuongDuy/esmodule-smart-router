import * as ethers from "ethers";
import * as dydxService from "./dydx/services/service.js";
import { KwentaSDK } from "./kwenta/index.js";
import { DYDX_TOKENS, KWENTA_TOKENS } from "./constants/constants.js";
import {
  checkForNewPosition,
  checkToClosePosition,
  getFee,
  kwentaGetMarket,
} from "./utils/utils.js";
import { IMarkets } from "./interfaces/index.js";
import { NETWORKS } from "./constants/constants.js";
import { NetworkId } from "./kwenta/types/common.js";

const init = async () => {
  const provider = new ethers.providers.JsonRpcProvider(NETWORKS.optimism.rpc);

  dydxService.initClient();
  kwentaSdk = new KwentaSDK({
    networkId: NETWORKS.optimism.chainId as NetworkId,
    provider,
  });
  await kwentaSdk.prices.startPriceUpdates(30000);
};

let kwentaSdk: KwentaSDK;

/**
 * Get current market data of kwenta, dydx and gmx
 */
const getMarkets = async (tokenIndex: number): Promise<IMarkets> => {
  // const kwentaMarket = await kwenta.getMarket(KWENTA_TOKENS[tokenIndex]);
  const kwentaMarket = await kwentaGetMarket(
    kwentaSdk,
    KWENTA_TOKENS[tokenIndex]
  );
  const dydxMarket = await dydxService.getMarket(DYDX_TOKENS[tokenIndex]);

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
  kwentaSdk: KwentaSDK,
  markets: IMarkets
) => {
  checkForNewPosition(markets);

  checkToClosePosition(markets);

  console.log("keeperDeposit: ", markets.kwenta.keeperDeposit.toNumber());

  getFee(kwentaSdk, markets.kwenta);
};

const main = async () => {
  await init();

  // setInterval(async () => {
  for (let i = 0; i < DYDX_TOKENS.length; i++) {
    const markets = await getMarkets(i);

    reviewContextFundingRate(kwentaSdk, markets);
  }
  // }, 30000)
};

main();
