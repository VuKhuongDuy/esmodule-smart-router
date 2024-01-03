import { SmartRouter } from '@pancakeswap/smart-router/evm'
import { createPublicClient, http } from 'viem'
import { bsc } from 'wagmi/chains'
import { GraphQLClient } from 'graphql-request'
import { Native, ChainId, CurrencyAmount, TradeType, Percent } from '@pancakeswap/sdk'
import { bscTokens } from '@pancakeswap/tokens'

const publicClient = createPublicClient({
  chain: bsc,
  transport: http('https://bsc-dataseed1.binance.org'),
  batch: {
    multicall: {
      batchSize: 1024 * 200,
    },
  },
})

const main = async () => {
  const quoteProvider = SmartRouter.createQuoteProvider({
    onChainProvider: () => publicClient,
  })
  const v3SubgraphClient = new GraphQLClient('https://api.thegraph.com/subgraphs/name/pancakeswap/exchange-v3-bsc')
  const v2SubgraphClient = new GraphQLClient('https://proxy-worker-api.pancakeswap.com/bsc-exchange')

  const swapFrom = bscTokens.usdt
  const swapTo = Native.onChain(56)
  const amount = CurrencyAmount.fromRawAmount(swapFrom, 10 ** 16)


  const [v2Pools, v3Pools] = await Promise.all([
    SmartRouter.getV2CandidatePools({
      onChainProvider: () => publicClient,
      v2SubgraphProvider: () => v2SubgraphClient,
      v3SubgraphProvider: () => v3SubgraphClient,
      currencyA: amount.currency,
      currencyB: swapTo,
    }),
    SmartRouter.getV3CandidatePools({
      onChainProvider: () => publicClient,
      subgraphProvider: () => v3SubgraphClient,
      currencyA: amount.currency,
      currencyB: swapTo,
      subgraphCacheFallback: false,
    }),
  ])
  const pools = [...v2Pools, ...v3Pools]
  const trade = await SmartRouter.getBestTrade(amount, swapTo, TradeType.EXACT_INPUT, {
    gasPriceWei: () => publicClient.getGasPrice(),
    maxHops: 2,
    maxSplits: 2,
    poolProvider: SmartRouter.createStaticPoolProvider(pools),
    quoteProvider,
    quoterOptimization: true,
  })

};

main();
