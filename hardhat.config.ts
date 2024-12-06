import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config()

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    BSCTestnet: {
      url: process.env.NODE_RPC_URL || "https://bsc-testnet-rpc.publicnode.com",
      accounts:
          process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : ["766500d1a41892e17208a009d3060be871ad2758b473bc4b91c79920a9fc9b7e"],
    }
  }
};

export default config;
