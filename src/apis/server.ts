import express from "express";
import { DYDX_WALLET, KWENTA_WALLET } from "../constants/constants.js";
import { DydxSDK } from "../dydx/services/service.js";
import { KWENTA_ADDRESS } from "../kwenta/sdk/constants/exchange.js";
import { KwentaSDKCustom } from "../kwenta/services.js";
import { getPositions } from "../service.js";
export var app = express();

export const initServer = (kwentaSdk: KwentaSDKCustom, dydxClient: DydxSDK) => {

    app.get("/wallet-info", async (req, res) => {
        const kwentaBalance = await kwentaSdk.kwentaGetBalance(KWENTA_WALLET);
        const dydxBalance = await dydxClient.getDydxBalance();
        res.send({
            kwenta: {
                address: KWENTA_ADDRESS,
                balanceOnDex: kwentaBalance.toNumber()
            },
            dydx: {
                address: DYDX_WALLET,
                balanceOnDex: dydxBalance.toNumber()
            }
        });
    });

    app.get("/positions/close-all", function (req, res) {
        res.send("Hello World");
    });

    app.get("/positions", async (req, res) => {
        const positions = await getPositions(kwentaSdk, dydxClient)
        res.send(positions);
    });
}
