import Wei, { wei } from "@synthetixio/wei";
import { HOUR_PROFIT } from "../constants/constants.js";

export const sort = (a: number, b: number) => {
  return a < b ? [a, b] : [b, a];
};

export const caculateProfit = (
  fundRateA: number,
  fundRateB: number,
  vol: Wei,
  feeA: Wei,
  feeB: Wei,
  sameSide: Boolean
) => {
  const [smaller, larger] = sort(fundRateA as number, fundRateB as number);
  const profitDaily = sameSide
    ? vol.mul((larger - smaller) * (HOUR_PROFIT as number))
    : vol.mul((larger + smaller) * (HOUR_PROFIT as number));

  return {
    profitDaily,
    totalFees: feeA?.add(feeB as Wei),
  };
};

export const findBiggest = (a: number, b: number, c: number): number => {
  if (a >= b && a >= c) return a;
  if (b >= a && b >= c) return b;
  return c;
};

export const checkLongPosition = (longPositionFundRate: number, otherFund: number): Boolean => {
  return Math.abs(longPositionFundRate) > Math.abs(otherFund) && longPositionFundRate < 0
}

export const checkShortPosition = (shortPositionFundRate: number, otherFund: number): Boolean => {
  return Math.abs(shortPositionFundRate) > Math.abs(otherFund) && shortPositionFundRate > 0
}

export const createNewPosition = async () => {};

export const makePosition = async (
  kwentaRate: number,
  dydxRate: number,
  vol: Wei
) => {};

export const kwentaMakePosition = async (vol: Wei) => {
  // kwentaSdk.
};

export const findBiggestProfit = (profitAndFees: any) => {
  const { kwenta_dydx, kwenta_gmx, dydx_gmx } = profitAndFees;

  const rKD =
    kwenta_dydx.totalFees.toNumber() == 0 ||
    kwenta_dydx.profitDaily.toNumber() == 0
      ? 0
      : kwenta_dydx.profitDaily.div(kwenta_dydx.totalFees).toNumber();
  const rKG =
    kwenta_gmx.totalFees.toNumber() == 0 ||
    kwenta_gmx.profitDaily.toNumber() == 0
      ? 0
      : kwenta_gmx.profitDaily.div(kwenta_gmx.totalFees).toNumber();
  const rDG =
    dydx_gmx.totalFees.toNumber() == 0 || dydx_gmx.profitDaily.toNumber() == 0
      ? 0
      : dydx_gmx.profitDaily.div(dydx_gmx.totalFees).toNumber();

  const rBiggest = findBiggest(rKD, rKG, rDG);
  return {
    dexPair: rBiggest === rKD ? 'kwenta_dydx' : rBiggest === rKG ? 'kwenta_gmx' : 'dydx_gmx',
    rKD,
    rKG,
    rDG
  }
}

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