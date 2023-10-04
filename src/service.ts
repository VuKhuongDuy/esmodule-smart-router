import Wei, { wei } from "@synthetixio/wei";
import {
	DYDX_TOKENS,
  KWENTA_TOKENS,
  KWENTA_WALLET,
  LEVERAGE,
  MAX_VOL,
  RATE_DREAM,
} from "./constants/constants.js";
import { DydxSDK } from "./dydx/services/service.js";
import { IMarketDexes, IMarkets, IPositions } from "./interfaces/index.js";
import { PositionSide } from "./kwenta/sdk/types/futures.js";
import {
	KwentaSDKCustom,
} from "./kwenta/services.js";
import {
  caculateProfit,
  findBiggestProfit,
} from "./utils/utils.js";
import * as telegram from "./telegram/index.js";
import { KWENTA_ADDRESS } from "./kwenta/sdk/constants/exchange.js";

export const getMarkets = async (KwentaSDKCustom: KwentaSDKCustom, dydxClient: DydxSDK): Promise<IMarkets> => {
  const dydxMarkets = await dydxClient.getMarket();
  const kwentaMarkets = await KwentaSDKCustom.kwentaGetMarket()
  return {
    kwenta: kwentaMarkets,
    dydx: dydxMarkets,
    gmx: null
  }
}

/**
 * Get current market data of kwenta, dydx and gmx
 */
export const getMarket = async (dydxClient: DydxSDK, markets: IMarkets, tokenIndex: number): Promise<IMarketDexes> => {
  const kwentaMarket = await KwentaSDKCustom.kwentaGetMarketByPair(
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

/**
 * Check current funding rate and decision create a new position or not
 */
export const checkForNewPosition = async (
  markets: IMarketDexes,
  KwentaSDKCustom: KwentaSDKCustom,
  dydxClient: DydxSDK,
  pair: string
) => {
  let profitAndFees;
  const kFundRate = (markets.kwenta.currentFundingRate as Wei).toNumber();
  const dydxFundRate = parseFloat(markets.dydx.fundingRate);
  const vols = await getVolumesOfPairs(KwentaSDKCustom, dydxClient);

  if (
    (kFundRate > 0 && dydxFundRate > 0) ||
    (kFundRate < 0 && dydxFundRate < 0)
  ) {
    profitAndFees = await getProfitAndFee(
      markets,
      vols,
      true,
      KwentaSDKCustom,
      dydxClient
    );
  } else {
    profitAndFees = await getProfitAndFee(
      markets,
      vols,
      false,
      KwentaSDKCustom,
      dydxClient
    );
  }

	console.log('profit: ', profitAndFees.kwenta_dydx.profitDaily.toNumber())
	console.log('fee: ', profitAndFees.kwenta_dydx.totalFees.toNumber())

  const { dexPair, rKD, rKG, rDG } = findBiggestProfit(profitAndFees);
  if (dexPair === "kwenta_dydx" && rKD > parseFloat(RATE_DREAM)) {
    // TODO check balance on 2 dex (kwenta & dydx)
    await telegram.notifyCreateOrder(
      pair,
      profitAndFees.kwenta_dydx.profitDaily,
      profitAndFees.kwenta_dydx.totalFees,
      vols.kdVol.toNumber()
    );

    // await kdCreatePosition(
		// 	KwentaSDKCustom,
    //   dydxClient,
    //   kFundRate,
    //   dydxFundRate,
    //   wei(vols.kdVol),
		//   markets
    // );
  } else if (
    dexPair === "kwenta_gmx" &&
    rKG > parseFloat(RATE_DREAM)
  ) {
    // TODO
	} else if (
    dexPair === "dydx_gmx" &&
    rDG > parseFloat(RATE_DREAM)
  ) {
    // TODO
  }
};

/**
 * Check current funding rate and decision close an already position
 */
export const checkToClosePosition = async (
  kwentaSdk: KwentaSDKCustom,
  dydxClient: DydxSDK,
  markets: IMarketDexes,
	positions: IPositions
) => {
	let profitAndFees;
  const kFundRate = (markets.kwenta.currentFundingRate as Wei).toNumber();
  const dydxFundRate = parseFloat(markets.dydx.fundingRate);
  const vols = await getVolumesOfPairs(kwentaSdk, dydxClient);

  if (
    (kFundRate > 0 && dydxFundRate > 0) ||
    (kFundRate < 0 && dydxFundRate < 0)
  ) {
    profitAndFees = await getProfitAndFee(
      markets,
      vols,
      true,
      kwentaSdk,
      dydxClient
    );
  } else {
    profitAndFees = await getProfitAndFee(
      markets,
      vols,
      false,
      kwentaSdk,
      dydxClient
    );
  }

	const { rKD, rKG, rDG } = findBiggestProfit(profitAndFees);

	const nearlyLiquidation = await kwentaSdk.checkNearlyLiquidation(positions.kwenta)
  if (rKD < parseFloat(RATE_DREAM) || nearlyLiquidation) {
    await telegram.sendMessage(`Close positions of pair ${positions.kwenta.marketKey} on Kwenta and Dydx`);

    await kdClosePosition(
      kwentaSdk, dydxClient, markets
    );
  } 
	
	if (
    rKG > parseFloat(RATE_DREAM)
  ) {
    // TODO
	} else if (
    rDG > parseFloat(RATE_DREAM)
  ) {
    // TODO
  }

};

/**
 * Create positions on kwenta and dydx
 * @param dydxClient dydxClient
 * @param kFundRate Funding rate on Kwenta
 * @param dFundRate Funding rate on dydx
 * @param vol volume of position
 */
export const kdCreatePosition = async (
	kwentaSdk: KwentaSDKCustom,
  dydxClient: DydxSDK,
  kFundRate: number,
  dFundRate: number,
  vol: Wei,
	markets: IMarketDexes
) => {
	// both funding rate same side
  if ((kFundRate > 0 && dFundRate > 0) || (kFundRate < 0 && dFundRate < 0)) {

		// kwenta funding rate > dydx funding rate
    if (Math.abs(kFundRate) > Math.abs(dFundRate)) {
      await kwentaSdk.kwentaCreatePosition(
        wei(vol),
        kFundRate > 0 ? PositionSide.SHORT : PositionSide.LONG,
				markets.kwenta
      );
      await dydxClient.dydxCreatePosition(
        wei(vol),
        kFundRate > 0 ? PositionSide.LONG : PositionSide.SHORT
      );
      await telegram.sendMessage(`Created KWENTA-long and DYDX-short`);

    } else if (Math.abs(dFundRate) > Math.abs(kFundRate)) {
      await dydxClient.dydxCreatePosition(
        wei(vol),
        dFundRate > 0 ? PositionSide.SHORT : PositionSide.LONG
      );
      await kwentaSdk.kwentaCreatePosition(
        wei(vol),
        dFundRate > 0 ? PositionSide.LONG : PositionSide.SHORT,
				markets.kwenta
      );
      await telegram.sendMessage(`Created KWENTA-short and DYDX-long`);
    }
  } else {
    if (kFundRate > 0) {
      await kwentaSdk.kwentaCreatePosition(wei(vol), PositionSide.SHORT, markets.kwenta);
      await dydxClient.dydxCreatePosition(wei(vol), PositionSide.LONG);
      await telegram.sendMessage(`Created KWENTA-short and DYDX-long`);
    } else {
      await kwentaSdk.kwentaCreatePosition(wei(vol), PositionSide.LONG, markets.kwenta);
      await dydxClient.dydxCreatePosition(wei(vol), PositionSide.SHORT);
      await telegram.sendMessage(`Created KWENTA-long and DYDX-short`);
    }
  }
};

export const kdClosePosition = async (kwentaSdk: KwentaSDKCustom, dydxClient: DydxSDK, marketDexes: IMarketDexes) => {
	await kwentaSdk.getCrossMarginAccounts();
	await kwentaSdk.closePosition(marketDexes.kwenta)
}

/**
 * Caculate profit and total fee if create position on dexes with vols and current funding rate.
 * @param markets Markets info of dexes
 * @param vols volume of position
 * @param sameSide both funding rates < 0 or > 0
 * @param KwentaSDKCustom kwenta sdk
 * @param dydxClient dydx client
 * @returns
 */
export const getProfitAndFee = async (
  markets: IMarketDexes,
  vols: any,
  sameSide: Boolean,
  kwentaSdk: KwentaSDKCustom,
  dydxClient: DydxSDK
) => {
  const { kwenta, dydx, gmx } = markets;
  let kFundRate, dydxFundRate, gmxFundRate: any;
  let kwentaFee, dydxFee, gmxFee: any;
  let response: any;

  if (kwenta) {
    kFundRate = (kwenta.currentFundingRate as Wei).abs().toNumber();
    kwentaFee = await kwentaSdk.kwentaCaculateFee(markets.kwenta, vols.kdVol);
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

/**
 * Get list current positions on dexes
 * @param KwentaSDKCustom
 * @param dydxClient
 * @param markets markets of all dexes
 */
export const getPositions = async (
  kwentaSdk: KwentaSDKCustom,
  dydxClient: DydxSDK,
) => {
  const markets = await getMarkets(kwentaSdk, dydxClient);
  const kwentaPositions = [] as any;
  const dydxPositions = await dydxClient.getDydxPositions();

  dydxPositions.forEach(async pos => {
    const pair = pos.market
    const index = DYDX_TOKENS.findIndex(m => m === pair)
    if(index >= 0) {
      const marketDexes = await getMarket(dydxClient, markets, index)
      const kPosition = await kwentaSdk.kwentaGetPositions(marketDexes.kwenta)
      kwentaPositions.push(kPosition)
    }
    // await checkToClosePosition(KwentaSDKCustom, dydxClient, marketDexes, {
    //   dydx: pos,
    //   kwenta: kPosition[0],
    //   gmx: null
    // });
  });
	return {
		kwenta: kwentaPositions,
		dydx: dydxPositions
	}
};

/**
 * Caculate volume will trade on each of dex-pair (kwenta-dydx, kwenta-gmx, dydx-gmx)
 * @param KwentaSDKCustom
 * @param dydxClient
 * @returns
 */
const getVolumesOfPairs = async (kwentaSdk: KwentaSDKCustom, dydxClient: DydxSDK) => {
  const kwentaBalance = await kwentaSdk.kwentaGetBalance( KWENTA_WALLET);
  const dydxBalance = await dydxClient.getDydxBalance();

  const gmxBalance = wei(0);
  // TODO get gmx balance

  let kdVol = kwentaBalance.toNumber() < MAX_VOL ? kwentaBalance : wei(MAX_VOL);
  kdVol = dydxBalance.toNumber() < kdVol.toNumber() ? dydxBalance : kdVol;

  let kgVol = kwentaBalance.toNumber() < MAX_VOL ? kwentaBalance : wei(MAX_VOL);
  kgVol = gmxBalance.toNumber() < kgVol.toNumber() ? gmxBalance : kgVol;

  let dgVol = gmxBalance.toNumber() < MAX_VOL ? gmxBalance : wei(MAX_VOL);
  dgVol = dydxBalance.toNumber() < dgVol.toNumber() ? dydxBalance : dgVol;

  kdVol = wei(200);
  return {
    kdVol: kdVol.mul(LEVERAGE),
    kgVol: kgVol.mul(LEVERAGE),
    dgVol: dgVol.mul(LEVERAGE),
  };
};