import { Market, MarketResponseObject } from "@dydxprotocol/v3-client"
import { FuturesMarket } from "../kwenta/sdk/types/futures"

declare enum DydxMarketStatus {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE",
  POST_ONLY = "POST_ONLY",
  CANCEL_ONLY = "CANCEL_ONLY",
  INITIALIZING = "INITIALIZING"
}

export interface IMarkets {
  kwenta: FuturesMarket,
  dydx: IDydxMarket,
  dydxMarkets: MarketResponseObject,
  gmx: any
}

export interface IDydxMarket {
  pair: Market,
  status: any,
  fundingRate: string
}