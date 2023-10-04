import { DydxSDK } from "./dydx/services/service.js";
import {
  DYDX_TOKENS,
  PORT,
} from "./constants/constants.js";
import { checkForNewPosition, getMarket, getMarkets } from "./service.js";
import * as telegram from "./telegram/index.js";
import { app, initServer } from "./apis/server.js";
import { KwentaSDKCustom } from "./kwenta/services.js";

export let kwentaSdk: KwentaSDKCustom;
export let dydxClient: DydxSDK;
let startScan = true;

const init = async () => {
  kwentaSdk = new KwentaSDKCustom();
  dydxClient = new DydxSDK();
};

const main = async () => {
  await init();

  initServer(kwentaSdk, dydxClient);

  setInterval(async () => {
    if (startScan) {
      const markets = await getMarkets(kwentaSdk, dydxClient);
      const kwentaPositions = [] as any;
      const dydxPositions = await dydxClient.getDydxPositions();

      dydxPositions.forEach(async (pos) => {
        const pair = pos.market;
        const index = DYDX_TOKENS.findIndex((m) => m === pair);
        if (index >= 0) {
          const marketDexes = await getMarket(dydxClient, markets, index);
          const kPosition = await kwentaSdk.kwentaGetPositions(
            marketDexes.kwenta
          );
          kwentaPositions.push(kPosition);
        }
        // await checkToClosePosition(kwentaSdk, dydxClient, marketDexes, {
        //   dydx: pos,
        //   kwenta: kPosition[0],
        //   gmx: null
        // });
      });

      await telegram.sendMessage(`----------START CHECK---------`);

      for (let i = 0; i < DYDX_TOKENS.length; i++) {
        console.log("----------------------", DYDX_TOKENS[i], "\t");
        const marketDexes = await getMarket(dydxClient, markets, i);
        await checkForNewPosition(
          marketDexes,
          kwentaSdk,
          dydxClient,
          DYDX_TOKENS[i]
        );
      }
    }
  }, 2 * 60 * 1000);
};

app.get('/stop', async (req, res) => {
  startScan = false
  res.send('Stopped scan')
})

app.get('/start', async (req, res) => {
  startScan = true
  res.send('Started scan')
})

app.listen(PORT, function () {
  console.log(`Server is listening on PORT ${PORT}`);
});

main();
