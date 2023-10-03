import "dotenv/config";

export const DYDX_TOKENS = [
//   "ETH-USD",
//   "BTC-USD",
//   "LINK-USD",
//   "SOL-USD",
//   "AVAX-USD",
//   "AAVE-USD",
//   "UNI-USD",
//   "MATIC-USD",
//   "DOGE-USD",
//   "ATOM-USD",
//   "NEAR-USD",
//   "ADA-USD",
//   "FIL-USD",
//   "BCH-USD",
//   "CRV-USD",
//   "DOT-USD",
//   "TRX-USD",
//   "ETC-USD",
//   "COMP-USD",
  "XMR-USD",
//   "MKR-USD",
//   "YFI-USD",
];

export const KWENTA_TOKENS = [
//   "ETH/sUSD",
//   "BTC/sUSD",
//   "LINK/sUSD",
//   "SOL/sUSD",
//   "AVAX/sUSD",
//   "AAVE/sUSD",
//   "UNI/sUSD",
//   "MATIC/sUSD",
//   "DOGE/sUSD",
//   "ATOM/sUSD",
//   "NEAR/sUSD",
//   "ADA/sUSD",
//   "FIL/sUSD",
//   "BCH/sUSD",
//   "CRV/sUSD",
//   "DOT/sUSD",
//   "TRX/sUSD",
//   "ETC/sUSD",
//   "COMP/sUSD",
  "XMR/sUSD",
//   "MKR/sUSD",
//   "YFI/sUSD",
];

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export const KWENTA_PRIVATE_KEY = process.env.ETHEREUM_PRIVATE_KEY || "";
export const DYDX_PRIVATE_KEY = process.env.ETHEREUM_PRIVATE_KEY || "";

export const NETWORKS = {
  optimism: {
    rpc: process.env.OPTIMISM_RPC_ENDPOINT || "https://optimism.llamarpc.com",
    chainId: 10,
  },
  goerli: {
    rpc:
      process.env.GOERLI_ENDPOINT ||
      "https://goerli.blockpi.network/v1/rpc/public",
    chainId: 5,
  },
};

export const KWENTA_WALLET = process.env.KWENTA_WALLET || "";
export const DYDX_WALLET = process.env.DYDX_WALLET || "";

export const MAX_VOL = 2000;
