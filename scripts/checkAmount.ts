import { ethers } from "hardhat";

async function main() {
  const amount = BigInt("884706658092311300609814453468038757968425670703");
  console.log("Amount in ETH:", ethers.formatEther(amount));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 