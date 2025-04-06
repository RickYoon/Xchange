import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Checking pool settings with the account:", deployer.address);

  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  
  console.log("Network:", network.name);
  console.log("Chain ID:", chainId);

  // 컨트랙트 주소
  const BSC_POOL = "0x4F94Ef1405eA3cf50F8f72C9C2Bd95E94D31A8fE";
  const SEPOLIA_POOL = "0x21269D5dBAd44F8f43130Af98F1A5FBD28ECbdbB";

  let pool;
  if (chainId === 97) { // BSC Testnet
    console.log("Checking BSC Pool...");
    pool = await ethers.getContractAt("EDUSwapPool", BSC_POOL);
  } else if (chainId === 11155111) { // Sepolia
    console.log("Checking Sepolia Pool...");
    pool = await ethers.getContractAt("EDUSwapPool", SEPOLIA_POOL);
  } else {
    throw new Error("Unsupported network");
  }

  const receiver = await pool.receiver();
  console.log("Current receiver address:", receiver);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 