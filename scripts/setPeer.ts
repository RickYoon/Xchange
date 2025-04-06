import { ethers, network } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Setting peers with account:", deployer.address);
  console.log("Network:", network.name);

  // Contract addresses
  const BSC_ADDRESSES = {
    router: "0xD0404B0F6BaB1a6553F06Ce7D12831cA0655C10B",
    receiver: "0x414089509d9162ae76BE5a197153F36A60c01bb1"
  };

  const SEPOLIA_ADDRESSES = {
    router: "0xD769e3e05F6c527BA6a955C5dFC0EF400dE84568",
    receiver: "0x3b403B358034B0055A94C3C72a55c9870679B188"
  };

  // LayerZero Chain IDs
  const BSC_CHAIN_ID = 40102;
  const SEPOLIA_CHAIN_ID = 40161;

  if (network.name === "bscTestnet") {
    // BSC Router -> Sepolia Receiver
    console.log("\nSetting peer on BSC Router...");
    console.log("Sepolia EID:", SEPOLIA_CHAIN_ID);
    console.log("Sepolia Receiver:", SEPOLIA_ADDRESSES.receiver);

    const bscRouter = await ethers.getContractAt("EDUSwapRouter", BSC_ADDRESSES.router, deployer);
    let tx = await bscRouter.setPeer(SEPOLIA_CHAIN_ID, ethers.zeroPadValue(SEPOLIA_ADDRESSES.receiver, 32));
    await tx.wait();
    console.log("BSC Router peer set to Sepolia Receiver");

    // BSC Receiver -> Sepolia Router
    console.log("\nSetting peer on BSC Receiver...");
    console.log("Sepolia EID:", SEPOLIA_CHAIN_ID);
    console.log("Sepolia Router:", SEPOLIA_ADDRESSES.router);

    const bscReceiver = await ethers.getContractAt("EDUSwapReceiver", BSC_ADDRESSES.receiver, deployer);
    tx = await bscReceiver.setPeer(SEPOLIA_CHAIN_ID, ethers.zeroPadValue(SEPOLIA_ADDRESSES.router, 32));
    await tx.wait();
    console.log("BSC Receiver peer set to Sepolia Router");

  } else if (network.name === "sepolia") {
    // Sepolia Router -> BSC Receiver
    console.log("\nSetting peer on Sepolia Router...");
    console.log("BSC EID:", BSC_CHAIN_ID);
    console.log("BSC Receiver:", BSC_ADDRESSES.receiver);

    const sepoliaRouter = await ethers.getContractAt("EDUSwapRouter", SEPOLIA_ADDRESSES.router, deployer);
    let tx = await sepoliaRouter.setPeer(BSC_CHAIN_ID, ethers.zeroPadValue(BSC_ADDRESSES.receiver, 32));
    await tx.wait();
    console.log("Sepolia Router peer set to BSC Receiver");

    // Sepolia Receiver -> BSC Router
    console.log("\nSetting peer on Sepolia Receiver...");
    console.log("BSC EID:", BSC_CHAIN_ID);
    console.log("BSC Router:", BSC_ADDRESSES.router);

    const sepoliaReceiver = await ethers.getContractAt("EDUSwapReceiver", SEPOLIA_ADDRESSES.receiver, deployer);
    tx = await sepoliaReceiver.setPeer(BSC_CHAIN_ID, ethers.zeroPadValue(BSC_ADDRESSES.router, 32));
    await tx.wait();
    console.log("Sepolia Receiver peer set to BSC Router");

  } else {
    console.error("Unsupported network");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 