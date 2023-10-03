import 'dotenv/config'


export const DYDX_TOKENS = ['ETH-USD']

export const KWENTA_TOKENS = ['ETH/sUSD']

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const NETWORKS = {
    optimism: {
        rpc: process.env.OPTIMISM_RPC_ENDPOINT || 'https://optimism.llamarpc.com',
        chainId: 10
    },
    goerli: {
        rpc: process.env.GOERLI_ENDPOINT || 'https://goerli.blockpi.network/v1/rpc/public',
        chainId: 5
    },
}

export const KWENTA_WALLET = process.env.KWENTA_WALLET || ''
export const DYDX_WALLET = process.env.DYDX_WALLET || ''

export const MAX_VOL = 2000
