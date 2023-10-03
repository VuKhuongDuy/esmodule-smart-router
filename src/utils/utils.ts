import Wei, { wei } from "@synthetixio/wei";
import {
  DYDX_WALLET,
  KWENTA_WALLET,
  MAX_VOL,
  ZERO_ADDRESS,
} from "../constants/constants.js";
import { dydxClient, kwentaSdk } from "../index.js";
import { IDydxMarket, IMarkets } from "../interfaces";
import { KwentaSDK } from "../kwenta/index.js";
import {
  FuturesMarket,
  FuturesMarketAsset,
  PositionSide,
} from "../kwenta/types/futures.js";
import { PricesMap } from "../kwenta/types/prices.js";
import { floorNumber } from "../kwenta/utils/number.js";

const sort = (a: number, b: number) => {
  return a < b ? [a, b] : [b, a];
};

const caculateProfit = (
  fundRateA: number,
  fundRateB: number,
  vol: Wei,
  feeA: Wei,
  feeB: Wei,
  sameSide: Boolean
) => {
  const [small, large] = sort(fundRateA as number, fundRateB as number);
  const profitDaily = sameSide
    ? vol.mul((large - small) * 24)
    : vol.mul((large + small) * 24);
  return {
    profitDaily,
    totalFees: feeA?.add(feeB as Wei),
  };
};

const findBiggest = (a: Wei, b: Wei, c: Wei): Wei => {
  if (a > b && a > c) return a;
  if (b > a && b > c) return b;
  return c;
};

/**
 * when both funding rate are > 0 or < 0
 */
export const getProfitAndFee = async (
  markets: IMarkets,
  vols: any,
  sameSide: Boolean
) => {
  const { kwenta, dydx, gmx } = markets;
  let kFundRate, dydxFundRate, gmxFundRate: any;
  let kwentaFee, dydxFee, gmxFee: any;
  let response: any;

  if (kwenta) {
    kFundRate = (kwenta.currentFundingRate as Wei).abs().toNumber();
    kwentaFee = await caculKwentaFee(markets.kwenta, vols.kdVol);
  }

  if (dydx) {
    dydxFundRate = Math.abs(parseFloat(dydx.fundingRate));
    dydxFee = await caculDydxFee(vols.kdVol);
  }

  if (gmx) {
    gmxFee = wei(0);
    gmxFundRate = 0;
  }

  const profitFeeZero = {
    profitDaily: wei(0),
    totalFees: wei(0),
  };

  return {
    kwenta_dydx:
      vols.kdVol > 0
        ? caculateProfit(
            kFundRate as number,
            dydxFundRate as number,
            vols.kdVol,
            kwentaFee as Wei,
            dydxFee as Wei,
            sameSide
          )
        : profitFeeZero,
    kwenta_gmx:
      vols.kgVol > 0
        ? caculateProfit(
            kFundRate as number,
            gmxFundRate as number,
            vols.kgVol,
            kwentaFee as Wei,
            gmxFee as Wei,
            sameSide
          )
        : profitFeeZero,
    dydx_gmx:
      vols.dgVol > 0
        ? caculateProfit(
            dydxFundRate as number,
            gmxFundRate as number,
            vols.dgVol,
            dydxFee as Wei,
            gmxFee as Wei,
            sameSide
          )
        : profitFeeZero,
  };
};

const getVolumesOfPairs = async () => {
  const kwentaBalance = await getKwentaBalance(KWENTA_WALLET);
  const dydxBalance = await getDydxBalance(DYDX_WALLET);

  const gmxBalance = wei(0);
  // TODO get gmx balance

  let kdVol = kwentaBalance.toNumber() < MAX_VOL ? kwentaBalance : wei(MAX_VOL);
  kdVol = dydxBalance < kdVol ? dydxBalance : kdVol;

  let kgVol = kwentaBalance.toNumber() < MAX_VOL ? kwentaBalance : wei(MAX_VOL);
  kgVol = gmxBalance < kgVol ? gmxBalance : kgVol;

  let dgVol = gmxBalance.toNumber() < MAX_VOL ? gmxBalance : wei(MAX_VOL);
  dgVol = dydxBalance < dgVol ? dydxBalance : dgVol;

  return {
    kdVol,
    kgVol,
    dgVol,
  };
};

export const createNewPosition = async () => {};

export const makePosition = async (
  kwentaRate: number,
  dydxRate: number,
  vol: Wei
) => {};

export const kwentaMakePosition = async (vol: Wei) => {
  // kwentaSdk.
};

export const getKwentaBalance = async (address: string) => {
  const balance = await kwentaSdk.synths.getSynthBalances(address);
  console.log({
    balancesMap_balance: balance.balancesMap.sUSD.balance.toNumber(),
  });
  console.log({
    balancesMap_usdBalance: balance.balancesMap.sUSD.usdBalance.toNumber(),
  });
  console.log({ balances_balance: balance.balances[0].balance.toNumber() });
  console.log({
    balances_usdBalance: balance.balances[0].usdBalance.toNumber(),
  });
  console.log({ totalUSDBalance: balance.totalUSDBalance.toNumber() });
  console.log({ susdWalletBalance: balance.susdWalletBalance.toNumber() });

  return balance.susdWalletBalance;
};

export const getDydxBalance = async (address: string) => {
  const balance = await dydxClient.client.private.getAccounts();

  return wei(balance.accounts[0].quoteBalance);
};

export const checkBalanceWallet = async () => {
  const balanceKwenta = await getKwentaBalance(KWENTA_WALLET);
  const balanceDydx = await getDydxBalance(KWENTA_WALLET);
};

const logFundingRate = (kwenta: any, kFundRate: any, dydxFundRate: any) => {
  // ******* -------------------------------------------------------
  // **
  console.log("Kwenta funding rate: ", kFundRate);
  console.log("dydx funding rate: ", dydxFundRate);
  console.log({ makerFee: (kwenta.feeRates.makerFee as Wei).toNumber() });
  console.log({ takerFee: (kwenta.feeRates.takerFee as Wei).toNumber() });
  console.log({
    makerFeeDelayedOrder: (
      kwenta.feeRates.makerFeeDelayedOrder as Wei
    ).toNumber(),
  });
  console.log({
    takerFeeDelayedOrder: (
      kwenta.feeRates.takerFeeDelayedOrder as Wei
    ).toNumber(),
  });
  console.log({
    makerFeeOffchainDelayedOrder: (
      kwenta.feeRates.makerFeeOffchainDelayedOrder as Wei
    ).toNumber(),
  });
  console.log({
    takerFeeOffchainDelayedOrder: (
      kwenta.feeRates.takerFeeOffchainDelayedOrder as Wei
    ).toNumber(),
  });
  // **
  // ******* -------------------------------------------------------
};

/**
 * Check current funding rate and decision create a new position or not
 */
export const checkForNewPosition = async (markets: IMarkets) => {
  const { kwenta, dydx, gmx } = markets;
  const kFundRate = (kwenta.currentFundingRate as Wei).toNumber();
  const dydxFundRate = parseFloat(dydx.fundingRate);

  logFundingRate(kwenta, kFundRate, dydxFundRate);

  const vols = await getVolumesOfPairs();

  let result;
  if (
    (kFundRate > 0 && dydxFundRate > 0) ||
    (kFundRate < 0 && dydxFundRate < 0)
  ) {
    result = await getProfitAndFee(markets, vols, true);
  } else {
    result = await getProfitAndFee(markets, vols, false);
  }

  const { kwenta_dydx, kwenta_gmx, dydx_gmx } = result;

  console.log({
    kdProfit: kwenta_dydx.profitDaily.toNumber(),
    kdFees: kwenta_dydx.totalFees.toNumber(),
  });

  const rKD =
    kwenta_dydx.totalFees == wei(0) || kwenta_dydx.profitDaily == wei(0)
      ? wei(0)
      : kwenta_dydx.profitDaily.div(kwenta_dydx.totalFees);
  const rKG =
    kwenta_gmx.totalFees == wei(0) || kwenta_gmx.profitDaily == wei(0)
      ? wei(0)
      : kwenta_gmx.profitDaily.div(kwenta_gmx.totalFees);
  const rDG =
    dydx_gmx.totalFees == wei(0) || dydx_gmx.profitDaily == wei(0)
      ? wei(0)
      : dydx_gmx.profitDaily.div(dydx_gmx.totalFees);

  if (
    findBiggest(rKD, rKD, rKG) === rKD &&
    rKD.toNumber() > parseFloat("0.2")
  ) {
    // TODO check balance on 2 dex (kwenta & dydx)
    // await makePosition(kFundRate, dydxFundRate, wei(vols.kdVol));
    await kwentaMakePosition(wei(vols.kdVol));
    //   // notify();
  }

  // TODO add 2 case
  // findBiggest(rKD, rKD, rKG) === rKG
  // findBiggest(rKD, rKD, rKG) === rDG
};

/**
 * Check current funding rate and decision close an already position
 */
export const checkToClosePosition = async (markets: IMarkets) => {};

export const caculKwentaFee = async (
  market: FuturesMarket,
  volumes: Wei
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

  return crossPreview.fee.add(market.keeperDeposit).mul(2);

  console.log({ fee: (crossPreview.fee as Wei).toBN().toString() });
  console.log({ leverage: (crossPreview.leverage as Wei).toBN().toString() });
  console.log({ liqPrice: (crossPreview.liqPrice as Wei).toBN().toString() });
  console.log({ margin: (crossPreview.margin as Wei).toBN().toString() });
  console.log({ price: (crossPreview.price as Wei).toBN().toString() });
  console.log({ sizeDelta: (crossPreview.sizeDelta as Wei).toBN().toString() });
  console.log({
    notionalValue: (crossPreview.notionalValue as Wei).toBN().toString(),
  });
  console.log({
    priceImpact: (crossPreview.priceImpact as Wei).toBN().toString(),
  });
};

export const kwentaGetMarket = async (pair: string, sdk: KwentaSDK) => {
  const markets = await sdk.futures.getMarkets();
  return markets.filter((elem: any) => elem.marketName === pair)[0];
};

export const caculDydxFee = async (volumes: Wei) => {
  const fees = await dydxClient.getFees();
  return volumes.mul(fees.defaultTakerFee).mul(2);
};
