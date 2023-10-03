import {
  DydxClient,
  Market,
  MarketsResponseObject,
  Trade,
} from "@dydxprotocol/v3-client";
import { configDotenv } from "dotenv";
import Web3 from "web3";
import { IMarket } from "../interfaces/IMarket";
import { IDydxMarket } from "../../interfaces";
import { DYDX_WALLET } from "../../constants/constants.js";

configDotenv()

export class dydxSDK {
    public client: DydxClient

    constructor() {
        const env = process.env.ENV || 'TEST'
        const HTTP_HOST = env === 'TEST' ? 'https://api.stage.dydx.exchange' : process.env.DYDX_API || "https://api.dydx.exchange";
        const web3 = new Web3();
        web3.eth.accounts.wallet.add(process.env.ETHEREUM_PRIVATE_KEY || "");
        this.client = new DydxClient(HTTP_HOST, { 
            web3: web3
        });
    }

    public async initClient(){
        const apiCreds = await this.client.onboarding.recoverDefaultApiCredentials(DYDX_WALLET)
        this.client.apiKeyCredentials = apiCreds
    }
    
    public async getMarket(pair: string): Promise<IDydxMarket>{
        const markets: { markets: MarketsResponseObject } = await this.client.public.getMarkets();
        const pairs = Object.keys(markets.markets)
        // const result: IMarket[] = [];
        const result = pairs.filter(m => markets.markets[m].market === pair)
        console.log({result})
        return {
            pair: markets.markets[result[0]].market,
            status: markets.markets[result[0]].status,
            fundingRate: markets.markets[result[0]].nextFundingRate
        }
    }
    
    public async getFees(){
        const fees = await this.client.public.getConfig()
    
        console.log({fees})
        return fees
    }
    
    public async makeOrder(){
        const userExists = await this.client.public.doesUserExistWithAddress(
            DYDX_WALLET,
        );
        console.log({userExists})
        
        const apiCreds = await this.client.onboarding.recoverDefaultApiCredentials(DYDX_WALLET)
        this.client.apiKeyCredentials = apiCreds
    
        const account = await this.client.private.getAccount(DYDX_WALLET, {
            apiKey: apiCreds.key,
            passphrase: apiCreds.passphrase
        })
    
        console.log({account})
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