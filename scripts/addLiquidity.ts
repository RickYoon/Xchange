import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Adding liquidity with the account:", deployer.address);

  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  
  console.log("Network:", network.name);
  console.log("Chain ID:", chainId);

  // 컨트랙트 주소
  const BSC_TOKEN = "0x182aEaafbEA475AdA1Eb704720Ba064ed8470172";
  const BSC_POOL = "0x4062b3521bdD369a6b2aF3F5Aa4e68547B26B657";
  const SEPOLIA_TOKEN = "0x046F7C1D3a56615802c80488C1B63551f8033783";
  const SEPOLIA_POOL = "0xBab1D732CbcD1DBb1A6b6768552Bb79213874f43";

  // Chain IDs
  const BSC_CHAIN_ID = 97;
  const SEPOLIA_CHAIN_ID = 11155111;

  let token, pool;
  const INITIAL_LIQUIDITY = ethers.parseEther("100000"); // 10만 EDU

  if (chainId === BSC_CHAIN_ID) {
    console.log("Adding liquidity to BSC Pool...");
    token = await ethers.getContractAt("MockEDUToken", BSC_TOKEN);
    pool = await ethers.getContractAt("EDUSwapPool", BSC_POOL);
  } else if (chainId === SEPOLIA_CHAIN_ID) {
    console.log("Adding liquidity to Sepolia Pool...");
    token = await ethers.getContractAt("MockEDUToken", SEPOLIA_TOKEN);
    pool = await ethers.getContractAt("EDUSwapPool", SEPOLIA_POOL);
  } else {
    throw new Error("Unsupported network");
  }

  // 토큰 승인
  console.log("Approving tokens...");
  const approveTx = await token.approve(await pool.getAddress(), INITIAL_LIQUIDITY);
  await approveTx.wait();
  console.log("Tokens approved");

  // 유동성 공급
  console.log("Depositing liquidity...");
  const depositTx = await pool.depositLiquidity(INITIAL_LIQUIDITY);
  await depositTx.wait();
  console.log("Liquidity added successfully!");

  // 잔액 확인
  const balance = await token.balanceOf(await pool.getAddress());
  console.log("Pool balance:", ethers.formatEther(balance), "EDU");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 