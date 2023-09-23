import KwentaSDK from '@deekaycoding/kwenta-sdk'
import ethers from "ethers";
import { wagmiClient } from './config';

const sdk = new KwentaSDK({ networkId: 10, provider: wagmiClient.provider })

export const getMarket = async () => {

  return sdk.futures.getMarkets()

}
