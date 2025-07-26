require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    injective: {
      url: "https://k8s.testnet.json-rpc.injective.network/",
      accounts: process.env.INJECTIVE_PRIVATE_KEY ? [process.env.INJECTIVE_PRIVATE_KEY] : [],
      chainId: 1439,
      gasPrice: 500000000, // 0.5 Gwei
    }
  },
  etherscan: {
    apiKey: {
      injective: "no-api-key-needed" // Injective explorer doesn't require API key
    },
    customChains: [
      {
        network: "injective",
        chainId: 1439,
        urls: {
          apiURL: "https://testnet.explorer.injective.network/api",
          browserURL: "https://testnet.explorer.injective.network"
        }
      }
    ]
  }
};