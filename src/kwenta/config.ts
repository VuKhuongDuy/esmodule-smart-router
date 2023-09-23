import { configureChains, createClient } from 'wagmi'
import {
	optimism,
} from 'wagmi/chains'
import { infuraProvider } from 'wagmi/providers/infura'
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import { publicProvider } from 'wagmi/providers/public'

export const STALL_TIMEOUT = 5000

export const chain = {
	optimism,
}

export const { chains, provider } = configureChains(Object.values(chain), [
	infuraProvider({
		apiKey: process.env.NEXT_PUBLIC_INFURA_PROJECT_ID!,
		stallTimeout: STALL_TIMEOUT,
		priority: process.env.NEXT_PUBLIC_PROVIDER_ID === 'INFURA' ? 1 : 3,
	}),
	jsonRpcProvider({
		rpc: () => ({
			http: 'https://optimism.llamarpc.com',
		}),
		stallTimeout: STALL_TIMEOUT,
		priority: 2,
	}),
	publicProvider({ stallTimeout: STALL_TIMEOUT, priority: 5 }),
])


export const wagmiClient = createClient({
	autoConnect: true,
	provider,
})

