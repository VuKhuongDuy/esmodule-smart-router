"use strict";
/**
 * Simple JavaScript example demonstrating authentication with private WebSockets channels.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const v3_client_1 = require("@dydxprotocol/v3-client");
const web3_1 = __importDefault(require("web3"));
const HTTP_HOST = "https://api.dydx.exchange";
const WS_HOST = "wss://api.dydx.exchange/v3/ws";
// NOTE: Set up web3 however your prefer to authenticate to your Ethereum account.
const web3 = new web3_1.default();
web3.eth.accounts.wallet.add(process.env.ETHEREUM_PRIVATE_KEY || "");
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const client = new v3_client_1.DydxClient(HTTP_HOST, { web3: web3 });
    // const client: DydxClient = new DydxClient(
    //   HTTP_HOST,
    //   {
    //       apiTimeout: 3000,
    //       starkPrivateKey: process.env.ETHEREUM_PRIVATE_KEY,
    //   },
    // );
    //   const apiCreds = await client.onboarding.recoverDefaultApiCredentials(
    //     address
    //   );
    //   client.apiKeyCredentials = apiCreds;
    const response = yield client.public.getHistoricalFunding({
        market: v3_client_1.Market.BTC_USD,
    });
    const historicalFunding = response.historicalFunding;
    console.log({ historicalFunding });
});
main();
