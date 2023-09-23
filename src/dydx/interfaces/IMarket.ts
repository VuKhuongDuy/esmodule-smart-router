import { Market } from "@dydxprotocol/v3-client";

declare enum MarketStatus {
    ONLINE = "ONLINE",
    OFFLINE = "OFFLINE",
    POST_ONLY = "POST_ONLY",
    CANCEL_ONLY = "CANCEL_ONLY",
    INITIALIZING = "INITIALIZING"
}

interface IMarket {
    pair: Market,
    status: MarketStatus,
    fundingRate: string
}

export { IMarket }