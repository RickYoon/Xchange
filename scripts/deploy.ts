import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId);

  // LayerZero Endpoints
  const BSC_TESTNET_ENDPOINT = "0x6Fcb97553D41516Cb228ac03FdC8B9a0a9df04A1";
  const SEPOLIA_ENDPOINT = "0xae92d5aD7583AD66E49A0c67BAd18F6ba52dDDc1";

  const gasSettings = {
    gasLimit: 3000000,
    maxFeePerGas: ethers.parseUnits("5", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits("1", "gwei")
  };

  // EDU Token 배포
  console.log("Deploying EDU Token...");
  const initialSupply = ethers.parseEther("1000000"); // 1,000,000 EDU
  const EDUToken = await ethers.getContractFactory("MockEDUToken");
  const token = await EDUToken.deploy(initialSupply, gasSettings);
  await token.waitForDeployment();
  console.log("EDU Token deployed to:", await token.getAddress());

  // Pool 배포
  console.log("Deploying EDUSwapPool...");
  const EDUSwapPool = await ethers.getContractFactory("EDUSwapPool");
  const pool = await EDUSwapPool.deploy(await token.getAddress(), gasSettings);
  await pool.waitForDeployment();
  console.log("EDUSwapPool deployed to:", await pool.getAddress());

  // Router 배포 (네트워크에 따라 다른 엔드포인트 사용)
  console.log("Deploying EDUSwapRouter...");
  const EDUSwapRouter = await ethers.getContractFactory("EDUSwapRouter");
  const router = await EDUSwapRouter.deploy(
    await token.getAddress(),
    await pool.getAddress(),
    network.chainId === 97n ? BSC_TESTNET_ENDPOINT : SEPOLIA_ENDPOINT,
    gasSettings
  );
  await router.waitForDeployment();
  console.log("EDUSwapRouter deployed to:", await router.getAddress());

  // 초기 설정
  console.log("Setting up contract connections...");
  
  // Router를 Pool의 receiver로 설정
  console.log("Setting Router as Pool's receiver...");
  const setReceiverTx = await pool.setRouter(await router.getAddress(), {
    ...gasSettings,
    gasLimit: 100000
  });
  await setReceiverTx.wait();
  console.log("Router set as Pool's receiver");

  // Pool에 초기 유동성 추가
  console.log("Adding initial liquidity...");
  const liquidityAmount = ethers.parseEther("1000"); // 1,000 EDU

  console.log("Waiting for token approval...");
  try {
    const approveTx = await token.approve(await pool.getAddress(), liquidityAmount, {
      ...gasSettings,
      gasLimit: 100000
    });
    console.log("Approval transaction sent:", approveTx.hash);
    const receipt = await approveTx.wait();
    console.log("Approval confirmed in block:", receipt.blockNumber);
  } catch (error) {
    console.error("Error during token approval:", error);
    throw error;
  }

  console.log("Token approved, depositing liquidity...");
  try {
    const depositTx = await pool.depositLiquidity(liquidityAmount, {
      ...gasSettings,
      gasLimit: 200000
    });
    console.log("Deposit transaction sent:", depositTx.hash);
    await depositTx.wait();
    console.log("Liquidity deposit confirmed");
  } catch (error) {
    console.error("Error during liquidity deposit:", error);
    throw error;
  }

  console.log("Deployment completed!");
  console.log({
    eduToken: await token.getAddress(),
    pool: await pool.getAddress(),
    router: await router.getAddress()
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 