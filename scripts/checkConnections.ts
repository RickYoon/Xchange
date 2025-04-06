import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Checking connections with the account:", deployer.address);

  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", Number(network.chainId));

  // 컨트랙트 주소
  const BSC_ROUTER = "0xeF9b375711163031009Fc7Ab1FA54E4CF7aE266B";
  const BSC_RECEIVER = "0x23bbddc963A58f4BfAcCB113465adD60d9c5dfaa";
  const BSC_POOL = "0x14AcF0BeAF49A23e5a7157c7f81B1DE25651dDcf";
  const SEPOLIA_ROUTER = "0x53839925DBaeF11976F9c8b1f63649d12f84F101";
  const SEPOLIA_RECEIVER = "0x692F9c6502B21B6915556317A11AE850eC8b2c79";
  const SEPOLIA_POOL = "0xdD9AE5debdaBA2971F47171eC5BB818CfD11F37D";

  try {
    if (network.chainId === 97n) { // BSC Testnet
      console.log("Checking BSC Testnet connections...");
      
      const pool = await ethers.getContractAt("EDUSwapPool", BSC_POOL);
      const router = await ethers.getContractAt("EDUSwapRouter", BSC_ROUTER);
      
      const poolRouter = await pool.router();
      const poolReceiver = await pool.receiver();
      const routerPool = await router.pool();
      
      console.log("Pool's Router:", poolRouter);
      console.log("Pool's Receiver:", poolReceiver);
      console.log("Router's Pool:", routerPool);
      
      console.log("Expected Router:", BSC_ROUTER);
      console.log("Expected Receiver:", BSC_RECEIVER);
      console.log("Expected Pool:", BSC_POOL);

    } else if (network.chainId === 11155111n) { // Sepolia
      console.log("Checking Sepolia connections...");
      
      const pool = await ethers.getContractAt("EDUSwapPool", SEPOLIA_POOL);
      const router = await ethers.getContractAt("EDUSwapRouter", SEPOLIA_ROUTER);
      
      const poolRouter = await pool.router();
      const poolReceiver = await pool.receiver();
      const routerPool = await router.pool();
      
      console.log("Pool's Router:", poolRouter);
      console.log("Pool's Receiver:", poolReceiver);
      console.log("Router's Pool:", routerPool);
      
      console.log("Expected Router:", SEPOLIA_ROUTER);
      console.log("Expected Receiver:", SEPOLIA_RECEIVER);
      console.log("Expected Pool:", SEPOLIA_POOL);
    }
  } catch (error: any) {
    console.error("Operation failed:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 