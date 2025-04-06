import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Setting peers with the account:", deployer.address);

  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  
  console.log("Network:", network.name);
  console.log("Chain ID:", chainId);

  // 컨트랙트 주소
  const BSC_ROUTER = "0x55B8Ec10146f1f1BaC176769a4B5a6803DeF6661";
  const BSC_RECEIVER = "0x16B0c563960Bc793052976CAeB8cF6d685E4BF23";
  const SEPOLIA_ROUTER = "0x03A6b82C1A75ebBF5e4a9c113df92Bff77Ef3845";
  const SEPOLIA_RECEIVER = "0x8015fe71f24E335C9463E70872F50a35C0984502";

  // Chain IDs (LayerZero v2)
  const BSC_CHAIN_ID = 40102;     // BSC Testnet
  const SEPOLIA_CHAIN_ID = 40161; // Sepolia

  let router;
  if (chainId === 97) { // BSC Testnet
    console.log("Setting peer on BSC Router...");
    router = await ethers.getContractAt("EDUSwapRouter", BSC_ROUTER);
    await router.setPeer(SEPOLIA_CHAIN_ID, ethers.zeroPadValue(SEPOLIA_RECEIVER, 32));
    console.log("BSC Router peer set to Sepolia Receiver");
  } else if (chainId === 11155111) { // Sepolia
    console.log("Setting peer on Sepolia Router...");
    router = await ethers.getContractAt("EDUSwapRouter", SEPOLIA_ROUTER);
    await router.setPeer(BSC_CHAIN_ID, ethers.zeroPadValue(BSC_RECEIVER, 32));
    console.log("Sepolia Router peer set to BSC Receiver");
  } else {
    throw new Error("Unsupported network");
  }

  console.log("Peer setting completed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 