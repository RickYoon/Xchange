import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Setting receiver with account:", deployer.address);

  console.log("Network:", network.name);

  // Contract addresses
  const BSC_POOL = "0x42bD9c9b6369e2ad7F63b1185922f30f6697986D";
  const SEPOLIA_POOL = "0x302152fec8924f2735d4643e9456BBBA4624c352";
  const BSC_RECEIVER = "0x4366640FDDbF4AD0B9231c3F0ecB9FD6709472D0";
  const SEPOLIA_RECEIVER = "0xFC1e45F8ce1828140DBBA53A83798352AA5f873e";

  // Get Pool contract
  const pool = await ethers.getContractAt(
    "EDUSwapPool",
    network.name === "bscTestnet" ? BSC_POOL : SEPOLIA_POOL,
    deployer
  );

  if (network.name === "bscTestnet") {
    console.log("\nSetting receiver on BSC Pool...");
    console.log("BSC Receiver:", BSC_RECEIVER);
    
    const tx = await pool.setReceiver(BSC_RECEIVER);
    await tx.wait();
    console.log("Receiver set successfully on BSC Pool");
  } else {
    console.log("\nSetting receiver on Sepolia Pool...");
    console.log("Sepolia Receiver:", SEPOLIA_RECEIVER);
    
    const tx = await pool.setReceiver(SEPOLIA_RECEIVER);
    await tx.wait();
    console.log("Receiver set successfully on Sepolia Pool");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 