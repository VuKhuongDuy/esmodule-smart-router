import Wei, { wei } from "@synthetixio/wei";
import { ZERO_ADDRESS } from "../constants/constants.js";
import { KwentaSDK } from "./sdk/index.js";
import { FuturesMarket, PositionSide } from "./sdk/types/futures.js";
import { floorNumber } from "./sdk/utils/number.js";

export const kwentaGetMarket = async (pair: string, sdk: KwentaSDK) => {
  const markets = await sdk.futures.getMarkets();
  return markets.filter((elem: any) => elem.marketName === pair)[0];
};

export const getKwentaPositions = async (
  kwentaSdk: KwentaSDK,
  market: FuturesMarket
) => {
  const accounts = await kwentaSdk.futures.getCrossMarginAccounts();
  const positions = await kwentaSdk.futures.getFuturesPositions(accounts[0], [
    {
      asset: market.asset,
      marketKey: market.marketKey,
      address: market.market,
    },
  ]);
};

export const getKwentaBalance = async (kwentaSdk: KwentaSDK, address: string) => {
  const balance = await kwentaSdk.synths.getSynthBalances(address);
  return balance.susdWalletBalance;
};

export const caculKwentaFee = async (
  market: FuturesMarket,
  volumes: Wei,
  kwentaSdk: KwentaSDK
): Promise<Wei> => {
  const prices = kwentaSdk.prices.currentPrices;
  const orderPrice = prices.onChain.sETH ? prices.onChain.sETH : wei("0");
  const sizeDelta = String(floorNumber(volumes.div(orderPrice), 4));
  const crossPreview = await kwentaSdk.futures.getCrossMarginTradePreview(
    ZERO_ADDRESS,
    market.marketKey,
    market.market,
    {
      sizeDelta: wei(sizeDelta),
      marginDelta: volumes,
      orderPrice,
      leverageSide: PositionSide.LONG,
    }
  );

  console.log("crossPreview.fee: ", crossPreview.fee.toNumber());

  console.log("market.keeperDeposit: ", market.keeperDeposit.toNumber());

  return crossPreview.fee.add(market.keeperDeposit).mul(2);
};
