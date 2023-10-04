import {
  DydxClient,
  Market,
  MarketResponseObject,
  MarketsResponseObject,
} from "@dydxprotocol/v3-client";
import { configDotenv } from "dotenv";
import Web3 from "web3";
import { IMarket } from "../interfaces/IMarket";
import { IDydxMarket } from "../../interfaces";
import { DYDX_PRIVATE_KEY, DYDX_WALLET } from "../../constants/constants.js";
import Wei, { wei } from "@synthetixio/wei";
import { PositionSide } from "../../kwenta/sdk/types/futures.js";

configDotenv();

export class DydxSDK {
  public client: DydxClient;

  constructor() {
    const env = process.env.ENV || "TEST";
    const HTTP_HOST =
      env === "TEST"
        ? "https://api.stage.dydx.exchange"
        : process.env.DYDX_API || "https://api.dydx.exchange";
    const web3 = new Web3();
    web3.eth.accounts.wallet.add(DYDX_PRIVATE_KEY || "");
    this.client = new DydxClient(HTTP_HOST, {
      web3: web3,
    });
  }

  public async initClient() {
    const apiCreds = await this.client.onboarding.recoverDefaultApiCredentials(
      DYDX_WALLET
    );
    this.client.apiKeyCredentials = apiCreds;
  }

  public async getMarket(): Promise<MarketsResponseObject> {
    const markets: { markets: MarketsResponseObject } =
      await this.client.public.getMarkets();
    return markets.markets;
  }

  public async getMarketPair(markets: MarketsResponseObject, pair: string) {
    const pairs = Object.keys(markets);
    const result = pairs.filter((m) => markets[m].market === pair);
    return {
      market: markets[result[0]],
      fundingRate: {
        pair: markets[result[0]].market,
        status: markets[result[0]].status,
        fundingRate: markets[result[0]].nextFundingRate,
      },
    };
  }

  public async getFees() {
    const fees = await this.client.public.getConfig();

    return fees;
  }

  public async dydxCreatePosition(vol: Wei, type: PositionSide) {
    const userExists = await this.client.public.doesUserExistWithAddress(
      DYDX_WALLET
    );
    console.log({ userExists });

    const apiCreds = await this.client.onboarding.recoverDefaultApiCredentials(
      DYDX_WALLET
    );
    this.client.apiKeyCredentials = apiCreds;

    const account = await this.client.private.getAccount(DYDX_WALLET, {
      apiKey: apiCreds.key,
      passphrase: apiCreds.passphrase,
    });

    console.log({ account });
  }

  public async caculDydxFee(volumes: Wei) {
    const fees = await this.getFees();
    return volumes.mul(fees.defaultTakerFee).mul(2);
  }

  public async getDydxPositions() {
    const result = await this.client.private.getPositions({
      market: Market.TRX_USD,
    });
    return result.positions
  }

  public async getDydxBalance() {
    const balance = await this.client.private.getAccounts();

    return wei(balance.accounts[0].quoteBalance);
  }
}

// markets: {
//     'CELO-USD': {
//       market: 'CELO-USD',
//       status: 'ONLINE',
//       baseAsset: 'CELO',
//       quoteAsset: 'USD',
//       stepSize: '1',
//       tickSize: '0.001',
//       indexPrice: '0.5039',
//       oraclePrice: '0.5059',
//       priceChange24H: '0.013486',
//       nextFundingRate: '0.0000119604',
//       nextFundingAt: '2023-08-09T03:00:00.000Z',
//       minOrderSize: '10',
//       type: 'PERPETUAL',
//       initialMarginFraction: '0.2',
//       maintenanceMarginFraction: '0.05',
//       transferMarginFraction: '0.011385',
//       volume24H: '1605531.374000',
//       trades24H: '1866',
//       openInterest: '1049887',
//       incrementalInitialMarginFraction: '0.02',
//       incrementalPositionSize: '17700',
//       maxPositionSize: '355000',
//       baselinePositionSize: '35500',
//       assetResolution: '1000000',
//       syntheticAssetId: '0x43454c4f2d36000000000000000000'
//     },

// {
//     fees: {
//       collateralAssetId: '0x02893294412a4c8f915f75892b395ebbf6859ec246ec365c3b1f56f47c3a0a5d',
//       collateralTokenAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
//       defaultMakerFee: '0.0002',
//       defaultTakerFee: '0.0005',
//       exchangeAddress: '0xD54f502e184B6B739d7D27a6410a67dc462D69c8',
//       maxExpectedBatchLengthMinutes: '720',
//       maxFastWithdrawalAmount: '200000',
//       cancelOrderRateLimiting: {
//         maxPointsMulti: 3,
//         maxPointsSingle: 9500,
//         windowSecMulti: 10,
//         windowSecSingle: 10
//       },
//       placeOrderRateLimiting: {
//         maxPoints: 1750,
//         windowSec: 10,
//         targetNotional: 40000,
//         minLimitConsumption: 4,
//         minMarketConsumption: 20,
//         minTriggerableConsumption: 100,
//         maxOrderConsumption: 100
//       }
//     }
//   }
