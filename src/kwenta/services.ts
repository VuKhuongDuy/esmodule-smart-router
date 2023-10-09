import Wei, { wei } from "@synthetixio/wei";
import { ethers } from "ethers";
import {
  KWENTA_PRIVATE_KEY,
  LEVERAGE,
  NETWORKS,
  RATE_STOPLOST,
  ZERO_ADDRESS,
} from "../constants/constants.js";
import { KWENTA_ADDRESS } from "./sdk/constants/exchange.js";
import {
  DEFAULT_PRICE_IMPACT_DELTA_PERCENT,
  SL_TP_MAX_SIZE,
} from "./sdk/constants/futures.js";
import { KwentaSDK } from "./sdk/index.js";
import {
  FuturesMarket,
  FuturesMarketAsset,
  FuturesPosition,
  FuturesPotentialTradeDetails,
  PositionSide,
  SmartMarginOrderInputs,
} from "./sdk/types/futures.js";
import {
  calculateDesiredFillPrice,
  getDefaultPriceImpact,
  serializePotentialTrade,
  unserializePotentialTrade,
} from "./sdk/utils/futures.js";
import { floorNumber } from "./sdk/utils/number.js";

export class KwentaSDKCustom {
  public client: KwentaSDK;
  public accounts: string[];
  public positions: FuturesPosition<Wei>[];
  public preview: any;

  constructor() {
    const provider = new ethers.providers.JsonRpcProvider(
      NETWORKS.optimism.rpc
    );

    this.client = new KwentaSDK({
      networkId: 10,
      provider,
    });
    this.initClient();

    this.accounts = [];
    this.positions = [];
    this.preview = null;
  }

  public async initClient() {
    const provider = new ethers.providers.JsonRpcProvider(
      NETWORKS.optimism.rpc
    );
    let signer = new ethers.Wallet(KWENTA_PRIVATE_KEY);
    signer = await signer.connect(provider);
    this.client.setSigner(signer);
    await this.client.prices.startPriceUpdates(30000);
    await this.getCrossMarginAccounts()
  }

  public async getCrossMarginAccounts() {
    this.accounts = await this.client.futures.getCrossMarginAccounts(
      KWENTA_ADDRESS
    );
  }

  public async getCrossMarginTradePreview(market: FuturesMarket, nativeSize: Wei, side: PositionSide) {
    const orderPrice = await this.getOrderPrice(market.asset);
    const nativeSizeDelta = side === PositionSide.LONG ? wei(nativeSize).div(orderPrice as Wei) : wei(nativeSize).div(orderPrice as Wei).neg();

    this.preview = await this.client.futures.getCrossMarginTradePreview(
      ZERO_ADDRESS,
      market.marketKey,
      market.market,
      {
        sizeDelta: wei(nativeSizeDelta),
        marginDelta: nativeSize.div(LEVERAGE),
        orderPrice: orderPrice as Wei,
        leverageSide: side,
      }
    );
  }

  public async kwentaGetMarket(): Promise<FuturesMarket[]> {
    return this.client.futures.getMarkets();
  }

  public static async kwentaGetMarketByPair(
    pair: string,
    markets: FuturesMarket[]
  ) {
    return markets.filter((elem: any) => elem.marketName === pair)[0];
  }

  public async kwentaGetPositions(market: FuturesMarket) {
    this.positions = await this.client.futures.getFuturesPositions(
      this.accounts[0],
      [
        {
          asset: market.asset,
          marketKey: market.marketKey,
          address: market.market,
        },
      ]
    );
    return this.positions.filter((m) => m.position);
  }

  public async kwentaGetBalance(address: string) {
    const balance = await this.client.synths.getSynthBalances(address);
    return balance.susdWalletBalance;
  }

  public async kwentaCaculateFee(
    market: FuturesMarket,
    volumes: Wei
  ): Promise<Wei> {
    await this.getCrossMarginTradePreview(market, volumes, PositionSide.LONG);

    console.log("preview.fee: ", this.preview.fee.toNumber());

    console.log("market.keeperDeposit: ", market.keeperDeposit.toNumber());

    return this.preview.fee.add(market.keeperDeposit).mul(2);
  }

  public async getOrderPrice(asset: FuturesMarketAsset) {
    const prices = this.client.prices.currentPrices;
    return prices.offChain[asset] ? prices.offChain[asset] : wei("0");
  }

  public async kwentaCreatePosition(
    nativeSize: Wei,
    tradeSide: PositionSide,
    market: FuturesMarket
  ) {
    await this.getCrossMarginTradePreview(market, nativeSize, tradeSide)
    const orderPrice = await this.getOrderPrice(market.asset);
    const nativeSizeDelta = tradeSide === PositionSide.LONG ? wei(nativeSize).div(orderPrice as Wei) : wei(nativeSize).div(orderPrice as Wei).neg();
    const marginDelta = nativeSize.div(LEVERAGE);

    const serializedPreview = serializePotentialTrade({
      ...this.preview,
      marketKey: market.marketKey,
    });

    const stopLostPrice =
      tradeSide === PositionSide.LONG
        ? (orderPrice as Wei).sub(
            (orderPrice as Wei).sub(this.preview.liqPrice).mul(RATE_STOPLOST)
          )
        : (orderPrice as Wei).add(
            this.preview.liqPrice.sub(orderPrice as Wei).mul(RATE_STOPLOST)
          );

    const maxSizeDelta = nativeSizeDelta.gt(0) ? SL_TP_MAX_SIZE.neg() : SL_TP_MAX_SIZE
    const desiredSLFillPrice = calculateDesiredFillPrice(
      maxSizeDelta,
      stopLostPrice,
      wei(DEFAULT_PRICE_IMPACT_DELTA_PERCENT.STOP_LOSS)
    );

    const unserialized = serializedPreview
      ? unserializePotentialTrade(serializedPreview)
      : null;
    const price = (unserialized as FuturesPotentialTradeDetails).price;
    const desiredFillPrice = calculateDesiredFillPrice(
      nativeSizeDelta,
      price,
      getDefaultPriceImpact("market")
    );

    const orderInputs: SmartMarginOrderInputs = {
      sizeDelta: nativeSizeDelta,
      marginDelta: marginDelta,
      desiredFillPrice: desiredFillPrice,
      // stopLoss: {
      //   price: stopLostPrice,
      //   desiredFillPrice: desiredSLFillPrice,
      //   sizeDelta: nativeSizeDelta.gt(0)
      //     ? SL_TP_MAX_SIZE.neg()
      //     : SL_TP_MAX_SIZE,
      // },
    };

    console.log("Trade side: ", tradeSide)
    console.log({desiredFillPrice: desiredFillPrice.toNumber()})
    console.log({desiredSLFillPrice: desiredSLFillPrice.toNumber()})
    console.log(orderInputs.marginDelta.toNumber())
    console.log(orderInputs.sizeDelta.toNumber())
    console.log(orderInputs.stopLoss?.price.toNumber())
    console.log(orderInputs.stopLoss?.sizeDelta.toNumber())
    console.log(this.accounts[0])

    const tx = await this.client.futures.submitCrossMarginOrder(
      {
        key: market.marketKey,
        address: market.market,
      },
      KWENTA_ADDRESS,
      this.accounts[0],
      orderInputs,
      { cancelPendingReduceOrders: false, cancelExpiredDelayedOrders: false }
    );

    await tx.wait();
  }

  public async getClosePositionPreview(position: FuturesPosition<Wei>) {
    const unserialized = this.preview
      ? unserializePotentialTrade(this.preview)
      : null;
    if (unserialized) {
      const priceImpact = getDefaultPriceImpact("market");
      let orderPrice = unserialized.price;
      const desiredFillPrice = calculateDesiredFillPrice(
        position.position?.side === PositionSide.LONG ? wei(-1) : wei(1),
        orderPrice,
        priceImpact
      );

      return {
        ...unserialized,
        desiredFillPrice,
        leverage: unserialized.margin.gt(0)
          ? unserialized.notionalValue.div(unserialized.margin).abs()
          : wei(0),
      };
    }
    return null;
  }

  public async closePosition(market: FuturesMarket) {
    const position = this.positions.filter((p) => p.asset === market.asset)[0];

    const preview = await this.getClosePositionPreview(position);

    const tx = await this.client.futures.closeCrossMarginPosition(
      { address: market.market, key: position.marketKey },
      this.accounts[0],
      preview?.desiredFillPrice as Wei
    );
  }
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
