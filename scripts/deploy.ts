import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId);

  // LayerZero V2 Endpoints
  const BSC_ENDPOINT = "0x6EDCE65403992e310A62460808c4b910D972f10f";
  const SEPOLIA_ENDPOINT = "0x6EDCE65403992e310A62460808c4b910D972f10f";

  // Deploy EDU Token with initial supply
  console.log("Deploying EDU Token...");
  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1 million EDU tokens
  const EDUToken = await ethers.getContractFactory("MockEDUToken");
  const token = await EDUToken.deploy(INITIAL_SUPPLY);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("EDU Token deployed to:", tokenAddress);

  // Deploy EDUSwapPool
  console.log("Deploying EDUSwapPool...");
  const EDUSwapPool = await ethers.getContractFactory("EDUSwapPool");
  const pool = await EDUSwapPool.deploy(tokenAddress);
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();
  console.log("EDUSwapPool deployed to:", poolAddress);

  // Deploy EDUSwapReceiver with appropriate endpoint
  console.log("Deploying EDUSwapReceiver...");
  const endpoint = Number(network.chainId) === 97 ? BSC_ENDPOINT : SEPOLIA_ENDPOINT;
  const EDUSwapReceiver = await ethers.getContractFactory("EDUSwapReceiver");
  const receiver = await EDUSwapReceiver.deploy(
    endpoint,
    poolAddress,
    deployer.address // initialOwner
  );
  await receiver.waitForDeployment();
  const receiverAddress = await receiver.getAddress();
  console.log("EDUSwapReceiver deployed to:", receiverAddress);

  // Deploy EDUSwapRouter with appropriate endpoint
  console.log("Deploying EDUSwapRouter...");
  const EDUSwapRouter = await ethers.getContractFactory("EDUSwapRouter");
  const router = await EDUSwapRouter.deploy(
    tokenAddress,
    poolAddress,
    endpoint,
    deployer.address // delegate address (owner)
  );
  await router.waitForDeployment();
  const routerAddress = await router.getAddress();
  console.log("EDUSwapRouter deployed to:", routerAddress);

  // Set up contract connections
  console.log("Setting up contract connections...");

  // Set Router as Pool's receiver
  console.log("Setting Router as Pool's receiver...");
  const setRouterTx = await pool.setRouter(routerAddress);
  await setRouterTx.wait();
  console.log("Router set as Pool's receiver");

  // Set up peers between Router and Receiver
  console.log("Setting up peers between Router and Receiver...");
  if (Number(network.chainId) === 97) {
    console.log("Setting up BSC peers...");
    const setPeerTx1 = await router.setPeer(
      40161,
      ethers.zeroPadValue(receiverAddress, 32),
      { gasLimit: 100000 }
    );
    await setPeerTx1.wait();
    const setPeerTx2 = await receiver.setPeer(
      40161,
      ethers.zeroPadValue(routerAddress, 32),
      { gasLimit: 100000 }
    );
    await setPeerTx2.wait();
    console.log("BSC peers set");
  } else {
    console.log("Setting up Sepolia peers...");
    const setPeerTx1 = await router.setPeer(
      40102,
      ethers.zeroPadValue(receiverAddress, 32),
      { gasLimit: 100000 }
    );
    await setPeerTx1.wait();
    const setPeerTx2 = await receiver.setPeer(
      40102,
      ethers.zeroPadValue(routerAddress, 32),
      { gasLimit: 100000 }
    );
    await setPeerTx2.wait();
    console.log("Sepolia peers set");
  }

  // Add initial liquidity
  console.log("Adding initial liquidity...");
  const INITIAL_LIQUIDITY = ethers.parseEther("1000");

  console.log("Waiting for token approval...");
  const approveTx = await token.approve(poolAddress, INITIAL_LIQUIDITY, {
    gasLimit: 100000
  });
  await approveTx.wait();
  console.log("Token approved");

  console.log("Depositing liquidity...");
  const depositTx = await pool.depositLiquidity(INITIAL_LIQUIDITY, {
    gasLimit: 200000
  });
  await depositTx.wait();
  console.log("Liquidity deposit confirmed");

  console.log("Deployment completed!");
  console.log({
    eduToken: tokenAddress,
    pool: poolAddress,
    receiver: receiverAddress,
    router: routerAddress
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 