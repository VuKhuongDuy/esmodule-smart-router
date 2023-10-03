import Wei, { wei } from "@synthetixio/wei";

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
    ? vol.mul((larger - smaller) * 24)
    : vol.mul((larger + smaller) * 24);

  return {
    profitDaily,
    totalFees: feeA?.add(feeB as Wei),
  };
};

export const findBiggest = (a: number, b: number, c: number): Wei => {
  if (a >= b && a >= c) return wei(a);
  if (b >= a && b >= c) return wei(b);
  return wei(c);
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