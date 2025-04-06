import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Setting peers with the account:", deployer.address);

  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId);

  // 컨트랙트 주소
  const BSC_ROUTER = "0x14e762C4cd7c00131637FdE0dDA0cBd1D2d9805e";
  const SEPOLIA_ROUTER = "0xa54F1C37521123484DB8dc26902567773409D994";

  // Chain IDs (LayerZero v2)
  const BSC_CHAIN_ID = 40102;     // BSC Testnet
  const SEPOLIA_CHAIN_ID = 40161; // Sepolia

  let router, dstChainId, dstAddress;
  if (network.chainId === 97n) { // BSC Testnet
    console.log("Setting peer for BSC Router...");
    router = await ethers.getContractAt("EDUSwapRouter", BSC_ROUTER);
    dstChainId = SEPOLIA_CHAIN_ID;
    dstAddress = SEPOLIA_ROUTER;
  } else if (network.chainId === 11155111n) { // Sepolia
    console.log("Setting peer for Sepolia Router...");
    router = await ethers.getContractAt("EDUSwapRouter", SEPOLIA_ROUTER);
    dstChainId = BSC_CHAIN_ID;
    dstAddress = BSC_ROUTER;
  } else {
    throw new Error("Unsupported network");
  }

  console.log("Setting peer...");
  console.log("Destination chain ID:", dstChainId);
  console.log("Destination address:", dstAddress);

  const tx = await router.setPeer(dstChainId, ethers.zeroPadValue(dstAddress, 32));
  await tx.wait();

  console.log("Peer set successfully!");
  console.log("Verifying peer...");
  const peer = await router.peers(dstChainId);
  console.log("Configured peer:", peer);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 