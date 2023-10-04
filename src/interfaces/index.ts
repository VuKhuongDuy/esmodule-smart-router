import { Market, MarketResponseObject, MarketsResponseObject, PositionResponseObject } from "@dydxprotocol/v3-client"
import Wei from "@synthetixio/wei"
import { FuturesMarket, FuturesPosition } from "../kwenta/sdk/types/futures"

declare enum DydxMarketStatus {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE",
  POST_ONLY = "POST_ONLY",
  CANCEL_ONLY = "CANCEL_ONLY",
  INITIALIZING = "INITIALIZING"
}

export interface IMarketDexes {
  kwenta: FuturesMarket,
  dydx: IDydxMarket,
  dydxMarkets: MarketResponseObject,
  gmx: any
}

export interface IMarkets {
  kwenta: FuturesMarket[],
  dydx: MarketsResponseObject,
  gmx: any
}

export interface IPositions {
  kwenta: FuturesPosition<Wei>,
  dydx: PositionResponseObject,
  gmx: any
}

export interface IDydxMarket {
  pair: Market,
  status: any,
  fundingRate: string
}