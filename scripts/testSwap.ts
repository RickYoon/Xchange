import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);

  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId);

  // Contract addresses
  const BSC_ADDRESSES = {
    token: "0x072E0323722d56ca3836bE716933c7dc7dceC322",
    pool: "0xFfE30090682ea6Ee5F85ac1acD145f4f3DCFF46C",
    receiver: "0x414089509d9162ae76BE5a197153F36A60c01bb1",
    router: "0xD0404B0F6BaB1a6553F06Ce7D12831cA0655C10B"
  };

  const SEPOLIA_ADDRESSES = {
    token: "0xc641Ba315c0018A68800e5c496e27821b52FAEE5",
    pool: "0xAB2D839FbD1669006220F84780677eBa90B4c1e5",
    receiver: "0x3b403B358034B0055A94C3C72a55c9870679B188",
    router: "0xD769e3e05F6c527BA6a955C5dFC0EF400dE84568"
  };

  // LayerZero V2 Chain IDs
  const BSC_CHAIN_ID = 40102;
  const SEPOLIA_CHAIN_ID = 40161;

  // Get contract instances
  const addresses = Number(network.chainId) === 97 ? BSC_ADDRESSES : SEPOLIA_ADDRESSES;
  const token = await ethers.getContractAt("MockEDUToken", addresses.token, deployer);
  const router = await ethers.getContractAt("EDUSwapRouter", addresses.router, deployer);

  // Swap amount
  const swapAmount = ethers.parseEther("1"); // 1 EDU token

  try {
    // Check token balance
    const balance = await token.balanceOf(deployer.address);
    console.log("Token balance before swap:", ethers.formatEther(balance), "EDU");

    // Check pool balance
    const poolBalance = await token.balanceOf(addresses.pool);
    console.log("Pool balance before swap:", ethers.formatEther(poolBalance), "EDU");

    // Approve tokens for router
    console.log("Approving tokens for router...");
    const approveTx = await token.approve(addresses.router, swapAmount);
    await approveTx.wait();
    console.log("Tokens approved");

    // Prepare adapter parameters (empty for now)
    const adapterParams = ethers.solidityPacked(
      ["uint16", "uint256"],
      [1, 500000] // version 1, gas limit 500000
    );

    // Get destination chain ID
    const dstChainId = Number(network.chainId) === 97 ? SEPOLIA_CHAIN_ID : BSC_CHAIN_ID;

    // Estimate fees
    console.log("Estimating fees...");
    const fees = await router.estimateFee(
      dstChainId,
      deployer.address,
      deployer.address,
      swapAmount,
      adapterParams,
      false
    );
    console.log("Estimated fees:", ethers.formatEther(fees.nativeFee), "ETH");

    // Execute swap
    console.log("Executing swap...");
    const swapTx = await router.swap(
      dstChainId,
      deployer.address,
      swapAmount,
      adapterParams,
      { value: fees.nativeFee }
    );
    const receipt = await swapTx.wait();
    console.log("Swap transaction hash:", receipt.hash);

    // Check final balance
    const finalBalance = await token.balanceOf(deployer.address);
    console.log("Token balance after swap:", ethers.formatEther(finalBalance), "EDU");

  } catch (error) {
    console.error("Error during swap:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 