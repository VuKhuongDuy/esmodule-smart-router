import { Market } from "@dydxprotocol/v3-client"
import { FuturesMarket } from "../kwenta/types/futures"

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
  gmx: any
}

export interface IDydxMarket {
  pair: Market,
  status: any,
  fundingRate: string
}