import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Fixing pool settings with the account:", deployer.address);

  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  
  console.log("Network:", network.name);
  console.log("Chain ID:", chainId);

  // 컨트랙트 주소
  const BSC_POOL = "0x4F94Ef1405eA3cf50F8f72C9C2Bd95E94D31A8fE";
  const BSC_RECEIVER = "0x4d12f4e70d8999fad3E14F95dC03950D13c011Ef";
  const SEPOLIA_POOL = "0x21269D5dBAd44F8f43130Af98F1A5FBD28ECbdbB";
  const SEPOLIA_RECEIVER = "0xFa69534c97867e24484226e46C6E33340bb562a8";

  let pool, receiver;
  if (chainId === 97) { // BSC Testnet
    console.log("Fixing BSC Pool...");
    pool = await ethers.getContractAt("EDUSwapPool", BSC_POOL);
    receiver = BSC_RECEIVER;
  } else if (chainId === 11155111) { // Sepolia
    console.log("Fixing Sepolia Pool...");
    pool = await ethers.getContractAt("EDUSwapPool", SEPOLIA_POOL);
    receiver = SEPOLIA_RECEIVER;
  } else {
    throw new Error("Unsupported network");
  }

  console.log("Current receiver:", await pool.receiver());
  console.log("Setting new receiver:", receiver);

  const tx = await pool.setReceiver(receiver);
  await tx.wait();

  console.log("New receiver set successfully!");
  console.log("Verifying new receiver:", await pool.receiver());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 