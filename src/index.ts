import * as ethers from "ethers";
import {DydxSDK} from "./dydx/services/service.js";
import { KwentaSDK } from "./kwenta/sdk/index.js";
import { DYDX_TOKENS, KWENTA_PRIVATE_KEY, KWENTA_TOKENS, NETWORKS } from "./constants/constants.js";
import { IMarketDexes, IMarkets } from "./interfaces/index.js";
import { MarketsResponseObject } from "@dydxprotocol/v3-client";
import { kwentaGetMarket, kwentaGetMarketByPair, kwentaGetPositions } from "./kwenta/services.js";
import { checkForNewPosition, checkToClosePosition } from "./service.js";
import * as telegram from "./telegram/index.js";

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

const getMarkets = async (): Promise<IMarkets> => {
  const dydxMarkets = await dydxClient.getMarket();
  const kwentaMarkets = await kwentaGetMarket(kwentaSdk)
  return {
    kwenta: kwentaMarkets,
    dydx: dydxMarkets,
    gmx: null
  }
}

/**
 * Get current market data of kwenta, dydx and gmx
 */
const getMarket = async (markets: IMarkets, tokenIndex: number): Promise<IMarketDexes> => {
  const kwentaMarket = await kwentaGetMarketByPair(
    KWENTA_TOKENS[tokenIndex],
    markets.kwenta
  );
  const dydxMarket = await dydxClient.getMarketPair(markets.dydx, DYDX_TOKENS[tokenIndex])

  return {
    kwenta: kwentaMarket,
    dydx: dydxMarket.fundingRate,
    dydxMarkets: dydxMarket.market,
    gmx: null,
  };
};

const main = async () => {
  await init();

  const markets = await getMarkets();
  const dydxPositions = await dydxClient.getDydxPositions();
  const kwentaPositions = [] as any;

  dydxPositions.forEach(async pos => {
    const pair = pos.market
    const index = DYDX_TOKENS.findIndex(m => m === pair)
    if(index >= 0) {
      const marketDexes = await getMarket(markets, index)
      const kPosition = await kwentaGetPositions(kwentaSdk, marketDexes.kwenta)
      kwentaPositions.push(kPosition)
    }
    // await checkToClosePosition(kwentaSdk, dydxClient, marketDexes, {
    //   dydx: pos,
    //   kwenta: kPosition[0],
    //   gmx: null
    // });
  });


  await telegram.sendMessage(`----------START CHECK---------`)

  for (let i = 0; i < DYDX_TOKENS.length; i++) {
    console.log('----------------------', DYDX_TOKENS[i], '\t')
    const marketDexes = await getMarket(markets, i)
    await checkForNewPosition(marketDexes, kwentaSdk, dydxClient, DYDX_TOKENS[i]);
  }
};

main();
