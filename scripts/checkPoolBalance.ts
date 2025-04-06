import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Checking balances with account:", deployer.address);
  console.log("Network:", network.name);

  // Contract addresses
  const BSC_TOKEN = "0x47f014E644A6382b9fee21EF3c27e577A2b94E51";
  const SEPOLIA_TOKEN = "0x0a055F157e71Bff70232e7558e82465f94aEe0Bd";
  const BSC_POOL = "0x42bD9c9b6369e2ad7F63b1185922f30f6697986D";
  const SEPOLIA_POOL = "0x302152fec8924f2735d4643e9456BBBA4624c352";

  // Get token contract
  const token = await ethers.getContractAt(
    "MockEDUToken",
    network.name === "bscTestnet" ? BSC_TOKEN : SEPOLIA_TOKEN,
    deployer
  );

  // Get pool contract
  const pool = await ethers.getContractAt(
    "EDUSwapPool",
    network.name === "bscTestnet" ? BSC_POOL : SEPOLIA_POOL,
    deployer
  );

  // Check pool balance
  const poolBalance = await token.balanceOf(pool.target);
  console.log("\nPool balance:", ethers.formatEther(poolBalance), "EDU");

  // Check deployer balance
  const deployerBalance = await token.balanceOf(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(deployerBalance), "EDU");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 