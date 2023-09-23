/**
 * Simple JavaScript example demonstrating authentication with private WebSockets channels.
 */

import Web3 from "web3";
import dotenv from 'dotenv'
import * as dydxService from "./dydx/services/service";
import * as kwentaService from './kwenta/service';

const init = () => {
  dydxService.initClient()
}

const main = async () => {
  init();
  // setInterval(async () => {
  //   console.log("-----------------------------")
  //   const markets: { markets: MarketsResponseObject } = await client.public.getMarkets();
  //   console.log(markets.markets)
  // }, 1000)

  const result = await kwentaService.getMarket();

  console.log({result})

  // const arr = await dydxService.getFundingRate();
  // console.log({arr})


};

main();
