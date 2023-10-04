import Wei, { wei } from "@synthetixio/wei";
import { LEVERAGE, RATE_STOPLOST, ZERO_ADDRESS } from "../constants/constants.js";
import { KWENTA_ADDRESS } from "./sdk/constants/exchange.js";
import { DEFAULT_PRICE_IMPACT_DELTA_PERCENT, SL_TP_MAX_SIZE } from "./sdk/constants/futures.js";
import { KwentaSDK } from "./sdk/index.js";
import { FuturesMarket, FuturesMarketAsset, FuturesPosition, PositionSide, SmartMarginOrderInputs } from "./sdk/types/futures.js";
import { calculateDesiredFillPrice, getDefaultPriceImpact } from "./sdk/utils/futures.js";
import { floorNumber } from "./sdk/utils/number.js";

export const kwentaGetMarket = async (sdk: KwentaSDK): Promise<FuturesMarket[]> => {
  return sdk.futures.getMarkets();
};

export const kwentaGetMarketByPair = async (pair: string, markets: FuturesMarket[]) => {
  return markets.filter((elem: any) => elem.marketName === pair)[0];
};

export const kwentaGetPositions = async (
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
  return positions.filter(m => m.position)
};

export const kwentaGetBalance = async (kwentaSdk: KwentaSDK, address: string) => {
  const balance = await kwentaSdk.synths.getSynthBalances(address);
  return balance.susdWalletBalance;
};

export const kwentaCaculateFee = async (
  market: FuturesMarket,
  volumes: Wei,
  kwentaSdk: KwentaSDK
): Promise<Wei> => {
  const orderPrice = getOrderPrice(kwentaSdk, market.asset);
  const sizeDelta = String(floorNumber(volumes.div(orderPrice as Wei), 4));

  const crossPreview = await kwentaSdk.futures.getCrossMarginTradePreview(
    ZERO_ADDRESS,
    market.marketKey,
    market.market,
    {
      sizeDelta: wei(sizeDelta),
      marginDelta: volumes.div(LEVERAGE),
      orderPrice: orderPrice as Wei,
      leverageSide: PositionSide.LONG,
    }
  );

  console.log("crossPreview.fee: ", crossPreview.fee.toNumber());

  console.log("market.keeperDeposit: ", market.keeperDeposit.toNumber());

  return crossPreview.fee.add(market.keeperDeposit).mul(2);
};

export const getOrderPrice = (kwentaSdk: KwentaSDK, asset: FuturesMarketAsset) => {
  const prices = kwentaSdk.prices.currentPrices;
  return prices.offChain[asset] ? prices.offChain[asset] : wei("0");

}

export const kwentaCreatePosition = async (kwentaSdk: KwentaSDK, vol: Wei, type: PositionSide, market: FuturesMarket) => {
  const accounts = await kwentaSdk.futures.getCrossMarginAccounts(KWENTA_ADDRESS)
  const orderPrice = getOrderPrice(kwentaSdk, market.asset)
  const sizeDelta = vol.div(orderPrice as Wei);
  const marginDelta = vol.div((orderPrice as Wei).mul(LEVERAGE));
  const previews = await kwentaSdk.futures.getCrossMarginTradePreview(
    accounts[0],
    market.marketKey,
    market.market,
    {
      sizeDelta: wei(sizeDelta),
      marginDelta: marginDelta,
      orderPrice: orderPrice as Wei,
      leverageSide: type,
    }
  )
  const stopLostPrice = type === PositionSide.LONG ? 
  (orderPrice as Wei).sub((orderPrice as Wei).sub(previews.liqPrice).mul(RATE_STOPLOST)) :
  (orderPrice as Wei).add(previews.liqPrice.sub(orderPrice as Wei).mul(RATE_STOPLOST))
    
  // const tradeMarket = await kwentaSdk.futures.getTradesForMarket(market.asset, KWENTA_ADDRESS, previews., 1)

  // const preview = previews.
	// 	const unserialized = preview ? unserializePotentialTrade(preview) : null

  // const priceImpact = getDefaultPriceImpact('market')
	// const conditionalOrderPrice = wei(orderPrice || 0)
	// 		const price = unserialized.price
	// 		const desiredFillPrice = calculateDesiredFillPrice(nativeSizeDelta, price, priceImpact)

  //     const desiredSLFillPrice = calculateDesiredFillPrice(
  //       previews.sizeDelta,
  //       wei(stopLossPrice || 0),
  //       wei(DEFAULT_PRICE_IMPACT_DELTA_PERCENT.STOP_LOSS)
  //     )

  // const orderInputs: SmartMarginOrderInputs = {
  //   sizeDelta: sizeDelta,
  //   marginDelta: marginDelta,
  //   desiredFillPrice: ,
  //   stopLoss: {
  //     price: stopLostPrice,
  //     desiredFillPrice: desiredSLFillPrice,
  //     sizeDelta: tradeInputs.nativeSizeDelta.gt(0) ? SL_TP_MAX_SIZE.neg() : SL_TP_MAX_SIZE,
  //   }
  // }

  // await kwentaSdk.futures.submitCrossMarginOrder(
  //   {
  //     key: market.marketKey,
  //     address: market.market
  //   },
  //   KWENTA_ADDRESS,
  //   accounts[0],
  //   orderInputs,
  //   { cancelPendingReduceOrders: isClosing, cancelExpiredDelayedOrders: !!staleOrder }
  // )
}

export const checkNearlyLiquidation = async (kwentaSdk: KwentaSDK, position: FuturesPosition<Wei>): Promise<Boolean> => {
  const prices = kwentaSdk.prices.currentPrices;

  return true;
}
// {
//   market: '0x031A448F59111000b96F016c37e9c71e57845096',
//   marketKey: 'sTRXPERP',
//   marketName: 'TRX/sUSD',
//   asset: 'TRX',
//   assetHex: '0x5452580000000000000000000000000000000000000000000000000000000000',
//   currentFundingRate: Wei {
//     bn: BigNumber { _hex: '-0xaf92aa67c738', _isBigNumber: true },
//     p: 18
//   },
//   currentFundingVelocity: Wei {
//     bn: BigNumber { _hex: '0x063950ac043b', _isBigNumber: true },
//     p: 18
//   },
//   feeRates: {
//     makerFee: Wei { bn: [BigNumber], p: 18 },
//     takerFee: Wei { bn: [BigNumber], p: 18 },
//     makerFeeDelayedOrder: Wei { bn: [BigNumber], p: 18 },
//     takerFeeDelayedOrder: Wei { bn: [BigNumber], p: 18 },
//     makerFeeOffchainDelayedOrder: Wei { bn: [BigNumber], p: 18 },
//     takerFeeOffchainDelayedOrder: Wei { bn: [BigNumber], p: 18 }
//   },
//   openInterest: {
//     shortPct: 0.1340244248176373,
//     longPct: 0.8659755751823627,
//     shortUSD: Wei { bn: [BigNumber], p: 18 },
//     longUSD: Wei { bn: [BigNumber], p: 18 },
//     long: Wei { bn: [BigNumber], p: 18 },
//     short: Wei { bn: [BigNumber], p: 18 }
//   },
//   marketDebt: Wei {
//     bn: BigNumber { _hex: '0x012f4b285a5c1f58db53', _isBigNumber: true },
//     p: 18
//   },
//   marketSkew: Wei {
//     bn: BigNumber { _hex: '0x1163abc8c94f6c61caf6', _isBigNumber: true },
//     p: 18
//   },
//   contractMaxLeverage: Wei {
//     bn: BigNumber { _hex: '0x017da3a04c7b3e0000', _isBigNumber: true },
//     p: 18
//   },
//   appMaxLeverage: Wei {
//     bn: BigNumber { _hex: '0x015af1d78b58c40000', _isBigNumber: true },
//     p: 18
//   },
//   marketSize: Wei {
//     bn: BigNumber { _hex: '0x17c1ec7628806adcb50a', _isBigNumber: true },
//     p: 18
//   },
//   marketLimitUsd: Wei {
//     bn: BigNumber { _hex: '0x0117918e92689320820000', _isBigNumber: true },
//     p: 18
//   },
//   marketLimitNative: Wei {
//     bn: BigNumber { _hex: '0x0c685fa11e01ec6f000000', _isBigNumber: true },
//     p: 18
//   },
//   minInitialMargin: Wei {
//     bn: BigNumber { _hex: '0x022b1c8c1227a00000', _isBigNumber: true },
//     p: 18
//   },
//   keeperDeposit: Wei {
//     bn: BigNumber { _hex: '0x121eb535fc671c8b', _isBigNumber: true },
//     p: 18
//   },
//   isSuspended: false,
//   marketClosureReason: 'market-closure',
//   settings: {
//     maxMarketValue: Wei { bn: [BigNumber], p: 18 },
//     skewScale: Wei { bn: [BigNumber], p: 18 },
//     delayedOrderConfirmWindow: 120,
//     offchainDelayedOrderMinAge: 2,
//     offchainDelayedOrderMaxAge: 60,
//     minDelayTimeDelta: 60,
//     maxDelayTimeDelta: 6000
//   }
// }