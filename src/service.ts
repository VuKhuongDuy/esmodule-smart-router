import Wei, { wei } from "@synthetixio/wei";
import { DYDX_WALLET, KWENTA_WALLET, MAX_VOL } from "./constants/constants.js";
import { DydxSDK } from "./dydx/services/service.js";
import { IMarkets } from "./interfaces/index.js";
import { KwentaSDK } from "./kwenta/sdk/index.js";
import { caculKwentaFee, getKwentaBalance, getKwentaPositions } from "./kwenta/services.js";
import { caculateProfit, findBiggest, kwentaMakePosition } from "./utils/utils.js";

/**
 * Check current funding rate and decision create a new position or not
 */
export const checkForNewPosition = async (
  markets: IMarkets,
  kwentaSdk: KwentaSDK,
  dydxClient: DydxSDK
) => {
  const { kwenta, dydx, gmx } = markets;
  const kFundRate = (kwenta.currentFundingRate as Wei).toNumber();
  const dydxFundRate = parseFloat(dydx.fundingRate);

  // logFundingRate(kwenta, kFundRate, dydxFundRate);

  const vols = await getVolumesOfPairs(kwentaSdk, dydxClient);

  let result;
  if (
    (kFundRate > 0 && dydxFundRate > 0) ||
    (kFundRate < 0 && dydxFundRate < 0)
  ) {
    result = await getProfitAndFee(markets, vols, true, kwentaSdk, dydxClient);
  } else {
    result = await getProfitAndFee(markets, vols, false, kwentaSdk, dydxClient);
  }

  const { kwenta_dydx, kwenta_gmx, dydx_gmx } = result;

  console.log("kwenta_dydx profit: ", kwenta_dydx.profitDaily.toNumber());
  console.log("kwenta_dydx total Fee: ", kwenta_dydx.totalFees.toNumber());

  const rKD =
    kwenta_dydx.totalFees.toNumber() == 0 ||
    kwenta_dydx.profitDaily.toNumber() == 0
      ? wei(0)
      : kwenta_dydx.profitDaily.div(kwenta_dydx.totalFees);
  const rKG =
    kwenta_gmx.totalFees.toNumber() == 0 ||
    kwenta_gmx.profitDaily.toNumber() == 0
      ? wei(0)
      : kwenta_gmx.profitDaily.div(kwenta_gmx.totalFees);
  const rDG =
    dydx_gmx.totalFees.toNumber() == 0 || dydx_gmx.profitDaily.toNumber() == 0
      ? wei(0)
      : dydx_gmx.profitDaily.div(dydx_gmx.totalFees);

  if (
    findBiggest(rKD.toNumber(), rKD.toNumber(), rDG.toNumber()) === rKD &&
    rKD.toNumber() > parseFloat("0.3")
  ) {
    console.log("Make a position on kwenta and dydx");
    // TODO check balance on 2 dex (kwenta & dydx)
    // await makePosition(kFundRate, dydxFundRate, wei(vols.kdVol));
    await kwentaMakePosition(wei(vols.kdVol));
    // TODO notify();
  }

  // TODO add 2 case
  // findBiggest(rKD, rKD, rKG) === rKG
  // findBiggest(rKD, rKD, rKG) === rDG
};

/**
 * Check current funding rate and decision close an already position
 */
export const checkToClosePosition = async (markets: IMarkets) => {};

/**
 * when both funding rate are > 0 or < 0
 */
export const getProfitAndFee = async (
  markets: IMarkets,
  vols: any,
  sameSide: Boolean,
  kwentaSdk: KwentaSDK,
  dydxClient: DydxSDK
) => {
  const { kwenta, dydx, gmx } = markets;
  let kFundRate, dydxFundRate, gmxFundRate: any;
  let kwentaFee, dydxFee, gmxFee: any;
  let response: any;

  if (kwenta) {
    kFundRate = (kwenta.currentFundingRate as Wei).abs().toNumber();
    kwentaFee = await caculKwentaFee(markets.kwenta, vols.kdVol, kwentaSdk);
  }

  if (dydx) {
    dydxFundRate = Math.abs(parseFloat(dydx.fundingRate));
    dydxFee = await dydxClient.caculDydxFee(vols.kdVol);
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

export const getPositions = async (
  kwentaSdk: KwentaSDK,
  dydxClient: DydxSDK,
  markets: IMarkets
) => {
  const kwentaPositions = getKwentaPositions(kwentaSdk, markets.kwenta);
  const dydxPositions = await dydxClient.getDydxPositions(markets.dydxMarkets);
};

const getVolumesOfPairs = async (kwentaSdk: KwentaSDK, dydxClient: DydxSDK) => {
  const kwentaBalance = await getKwentaBalance(kwentaSdk, KWENTA_WALLET);
  const dydxBalance = await dydxClient.getDydxBalance(DYDX_WALLET);

  const gmxBalance = wei(0);
  // TODO get gmx balance

  let kdVol = kwentaBalance.toNumber() < MAX_VOL ? kwentaBalance : wei(MAX_VOL);
  kdVol = dydxBalance.toNumber() < kdVol.toNumber() ? dydxBalance : kdVol;

  let kgVol = kwentaBalance.toNumber() < MAX_VOL ? kwentaBalance : wei(MAX_VOL);
  kgVol = gmxBalance.toNumber() < kgVol.toNumber() ? gmxBalance : kgVol;

  let dgVol = gmxBalance.toNumber() < MAX_VOL ? gmxBalance : wei(MAX_VOL);
  dgVol = dydxBalance.toNumber() < dgVol.toNumber() ? dydxBalance : dgVol;

  kdVol = wei(1000);
  console.log("Volume: ", kdVol.toNumber());
  return {
    kdVol,
    kgVol,
    dgVol,
  };
};

// export const checkBalanceWallet = async () => {
//   const balanceKwenta = await getKwentaBalance(KWENTA_WALLET);
//   const balanceDydx = await getDydxBalance(KWENTA_WALLET);
// };
