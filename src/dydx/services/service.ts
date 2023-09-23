import {
  DydxClient,
  Market,
  MarketsResponseObject,
  Trade,
} from "@dydxprotocol/v3-client";
import { configDotenv } from "dotenv";
import Web3 from "web3";
import { IMarket } from "../interfaces/IMarket";

configDotenv()

let dydxClient: DydxClient

export const initClient = () => {
    const HTTP_HOST = process.env.HOST_DYDX || "https://api.dydx.exchange";
    const WS_HOST = "wss://api.dydx.exchange/v3/ws";

    const web3 = new Web3();
    web3.eth.accounts.wallet.add(process.env.ETHEREUM_PRIVATE_KEY || "");

    dydxClient = new DydxClient(HTTP_HOST, { web3: web3 });
}

export const getFundingRate = async () => {
    const markets: { markets: MarketsResponseObject } = await dydxClient.public.getMarkets();
    const pairs = Object.keys(markets.markets)
    const result: IMarket[] = [];
    pairs.forEach(pair => {
        const elem = markets.markets[pair]
        result.push({
            pair: elem.market,
            status: elem.status,
            fundingRate: elem.nextFundingRate
        })
    });

    return result;
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