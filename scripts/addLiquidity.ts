import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Adding liquidity with account:", deployer.address);
  console.log("Network:", network.name);

  // Contract addresses
  const BSC_TOKEN = "0x47f014E644A6382b9fee21EF3c27e577A2b94E51";
  const SEPOLIA_TOKEN = "0x0a055F157e71Bff70232e7558e82465f94aEe0Bd";
  const BSC_POOL = "0x42bD9c9b6369e2ad7F63b1185922f30f6697986D";
  const SEPOLIA_POOL = "0x302152fec8924f2735d4643e9456BBBA4624c352";

  // Get contracts
  const token = await ethers.getContractAt(
    "EDUToken",
    network.name === "bscTestnet" ? BSC_TOKEN : SEPOLIA_TOKEN,
    deployer
  );

  const pool = await ethers.getContractAt(
    "EDUSwapPool",
    network.name === "bscTestnet" ? BSC_POOL : SEPOLIA_POOL,
    deployer
  );

  // Amount to add as liquidity (1000 EDU)
  const amount = ethers.parseEther("1000");

  // First approve tokens
  console.log("\nApproving tokens...");
  const approveTx = await token.approve(pool.target, amount);
  await approveTx.wait();
  console.log("Tokens approved");

  // Add liquidity
  console.log("\nAdding liquidity...");
  const tx = await pool.depositLiquidity(amount);
  await tx.wait();
  console.log("Liquidity added successfully");

  // Check new balance
  const poolBalance = await token.balanceOf(pool.target);
  console.log("\nNew pool balance:", ethers.formatEther(poolBalance), "EDU");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 