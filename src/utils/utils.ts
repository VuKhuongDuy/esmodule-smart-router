import Wei, { wei } from '@synthetixio/wei'
import { ZERO_ADDRESS } from "../constants/constants.js";
import { IMarkets } from "../interfaces"
import { KwentaSDK } from '../kwenta/index.js';
import { FuturesMarket, FuturesMarketAsset, PositionSide } from '../kwenta/types/futures.js';
import { PricesMap } from '../kwenta/types/prices.js';
import { floorNumber } from '../kwenta/utils/number.js';

export const caculFee = async () => {
  
}

export const previewProfit = (): Boolean => {
  return true;
}

export const createNewPosition = async () => {

}

export const checkBalanceWallet = async (): Promise<Boolean> => {
  return true;
}

/**
 * Check current funding rate and decision create a new position or not
 */
export const checkForNewPosition = async (markets: IMarkets) => {
  const {kwenta, dydx, gmx} = markets
  const kFundRate = (kwenta.currentFundingRate as Wei).toNumber()
  const dydxFundRate = parseFloat(dydx.fundingRate)

  console.log('Kwenta funding rate: ', kFundRate)
  console.log('dydx funding rate: ', dydxFundRate)
  console.log({makerFee: (kwenta.feeRates.makerFee as Wei).toNumber()})
  console.log({takerFee: (kwenta.feeRates.takerFee as Wei).toNumber()})
  console.log({makerFeeDelayedOrder: (kwenta.feeRates.makerFeeDelayedOrder as Wei).toNumber()})
  console.log({takerFeeDelayedOrder: (kwenta.feeRates.takerFeeDelayedOrder as Wei).toNumber()})
  console.log({makerFeeOffchainDelayedOrder: (kwenta.feeRates.makerFeeOffchainDelayedOrder as Wei).toNumber()})
  console.log({takerFeeOffchainDelayedOrder: (kwenta.feeRates.takerFeeOffchainDelayedOrder as Wei).toNumber()})

  if(kFundRate > 0 && dydxFundRate > 0) {
    // if(previewProfit(kwenta, dydx) && checkBalanceWallet()) {
    //   createNewPosition();
    //   notify();
    // }
  } else if(kFundRate < 0 && dydxFundRate < 0) {

  } else if(kFundRate > 0 && dydxFundRate < 0) {

  } else if(kFundRate < 0 && dydxFundRate > 0) {

  }
}

/**
 * Check current funding rate and decision close an already position 
 */
export const checkToClosePosition = async (markets: IMarkets) => {

}

export const getFee = async (kwentaSdk: KwentaSDK, market: FuturesMarket) => {
  const prices = kwentaSdk.prices.currentPrices;
  const orderPrice = prices.onChain.sETH ? prices.onChain.sETH : wei('0')
  const sizeDelta = String(floorNumber(wei('50000').div(orderPrice), 4))
  const crossPreview = await kwentaSdk.futures.getCrossMarginTradePreview(ZERO_ADDRESS, market.marketKey,
    market.market,
    {
      sizeDelta: wei(sizeDelta),
      marginDelta: wei('10000'),
      orderPrice,
      leverageSide: PositionSide.LONG
    })

  return crossPreview

  console.log({fee: (crossPreview.fee as Wei).toBN().toString()})
  console.log({leverage: (crossPreview.leverage as Wei).toBN().toString()})
  console.log({liqPrice: (crossPreview.liqPrice as Wei).toBN().toString()})
  console.log({margin: (crossPreview.margin as Wei).toBN().toString()})
  console.log({price: (crossPreview.price as Wei).toBN().toString()})
  console.log({sizeDelta: (crossPreview.sizeDelta as Wei).toBN().toString()})
  console.log({notionalValue: (crossPreview.notionalValue as Wei).toBN().toString()})
  console.log({priceImpact: (crossPreview.priceImpact as Wei).toBN().toString()})
}

export const kwentaGetMarket = async (sdk: KwentaSDK, pair: string) => {
  const markets = await sdk.futures.getMarkets();
  return markets.filter((elem: any) => elem.marketName === pair)[0]
}