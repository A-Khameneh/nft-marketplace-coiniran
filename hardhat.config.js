require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config()
require("@nomicfoundation/hardhat-toolbox")

/** @type import('hardhat/config').HardhatUserConfig */

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL 
const PRIVATE_KEY = process.env.PRIVATE_KEY 
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ""

module.exports = {

  defaultNetwork: "hardhat",
  networks: {
      hardhat: {
          chainId: 1337,
          // gasPrice: 130000000000,
      },
      sepolia: {
          url: SEPOLIA_RPC_URL,
          accounts: [PRIVATE_KEY],
          chainId: 11155111,
          blockConfirmations: 6,
      },
  },

  solidity: "0.8.20",

  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
    customChains: [], // uncomment this line if you are getting a TypeError: customChains is not iterable
  },
};
