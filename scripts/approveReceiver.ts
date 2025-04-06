import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Approving Receiver with account:", deployer.address);
  console.log("Network:", network.name);

  // Contract addresses
  const BSC_TOKEN = "0x47f014E644A6382b9fee21EF3c27e577A2b94E51";
  const SEPOLIA_TOKEN = "0x0a055F157e71Bff70232e7558e82465f94aEe0Bd";
  const BSC_POOL = "0x42bD9c9b6369e2ad7F63b1185922f30f6697986D";
  const SEPOLIA_POOL = "0x302152fec8924f2735d4643e9456BBBA4624c352";
  const BSC_RECEIVER = "0x4366640FDDbF4AD0B9231c3F0ecB9FD6709472D0";
  const SEPOLIA_RECEIVER = "0xFC1e45F8ce1828140DBBA53A83798352AA5f873e";

  // Get contracts
  const token = await ethers.getContractAt(
    "MockEDUToken",
    network.name === "bscTestnet" ? BSC_TOKEN : SEPOLIA_TOKEN,
    deployer
  );

  const pool = await ethers.getContractAt(
    "EDUSwapPool",
    network.name === "bscTestnet" ? BSC_POOL : SEPOLIA_POOL,
    deployer
  );

  // Check current allowance
  const currentAllowance = await token.allowance(
    pool.target,
    network.name === "bscTestnet" ? BSC_RECEIVER : SEPOLIA_RECEIVER
  );
  console.log("\nCurrent Pool->Receiver allowance:", ethers.formatEther(currentAllowance), "EDU");

  // Approve max amount for Receiver
  const maxAmount = ethers.parseEther("1000000"); // 1 million EDU
  console.log("\nApproving Receiver to spend from Pool...");
  
  // We need to call approve from the Pool contract
  const tokenInterface = new ethers.Interface([
    "function approve(address spender, uint256 amount) external returns (bool)"
  ]);
  
  const calldata = tokenInterface.encodeFunctionData("approve", [
    network.name === "bscTestnet" ? BSC_RECEIVER : SEPOLIA_RECEIVER,
    maxAmount
  ]);
  
  const tx = await pool.execute(token.target, calldata);
  await tx.wait();
  console.log("Approval successful");

  // Check new allowance
  const newAllowance = await token.allowance(
    pool.target,
    network.name === "bscTestnet" ? BSC_RECEIVER : SEPOLIA_RECEIVER
  );
  console.log("\nNew Pool->Receiver allowance:", ethers.formatEther(newAllowance), "EDU");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 