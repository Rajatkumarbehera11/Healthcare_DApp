import { createConfig, http } from "wagmi";
import { localhost, holesky, sepolia } from "wagmi/chains";
import { walletConnect, injected } from "wagmi/connectors";

const PROJECT_ID = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "demo-project-id";

const somnia = {
  id: 50312,
  name: "Somnia Testnet",
  network: "somnia",
  nativeCurrency: {
    decimals: 18,
    name: "Somnia",
    symbol: "SOM",
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_SOMNIA_RPC_URL || ""],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_SOMNIA_RPC_URL || ""],
    },
  },
  blockExplorers: {
    default: { name: "Somnia Explorer", url: "https://explorer.somnia.io" },
  },
  testnet: true,
};

export const wagmiConfig = createConfig({
  chains: [localhost, holesky, sepolia, somnia],
  connectors: [
    injected(),
    walletConnect({
      projectId: PROJECT_ID,
    }),
  ],
  transports: {
    [localhost.id]: http(),
    [holesky.id]: http(),
    [sepolia.id]: http(),
    [somnia.id]: http(),
  },
});
