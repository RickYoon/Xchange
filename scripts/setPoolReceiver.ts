import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Setting Pool Receiver with account:", deployer.address);
  console.log("Network:", network.name);

  // Contract addresses
  const BSC_ADDRESSES = {
    pool: "0xFfE30090682ea6Ee5F85ac1acD145f4f3DCFF46C",
    receiver: "0x414089509d9162ae76BE5a197153F36A60c01bb1"
  };

  const SEPOLIA_ADDRESSES = {
    pool: "0xAB2D839FbD1669006220F84780677eBa90B4c1e5",
    receiver: "0x3b403B358034B0055A94C3C72a55c9870679B188"
  };

  const addresses = network.name === "bscTestnet" ? BSC_ADDRESSES : SEPOLIA_ADDRESSES;

  console.log("\nSetting Receiver on Pool...");
  console.log("Pool address:", addresses.pool);
  console.log("Receiver address:", addresses.receiver);

  const pool = await ethers.getContractAt("EDUSwapPool", addresses.pool, deployer);
  
  // 현재 설정된 receiver 확인
  const currentReceiver = await pool.receiver();
  console.log("Current receiver:", currentReceiver);

  // 새로운 receiver 설정
  const tx = await pool.setReceiver(addresses.receiver);
  await tx.wait();
  
  // 변경된 receiver 확인
  const newReceiver = await pool.receiver();
  console.log("New receiver set to:", newReceiver);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 