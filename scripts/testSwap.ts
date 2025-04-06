import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Testing swap with the account:", deployer.address);

  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  
  console.log("Network:", network.name);
  console.log("Chain ID:", chainId);

  // 컨트랙트 주소
  const BSC_TOKEN = "0xE39331eCe138462a8974c8315Ac455885d4b6369";
  const BSC_ROUTER = "0xeF9b375711163031009Fc7Ab1FA54E4CF7aE266B";
  const SEPOLIA_TOKEN = "0xF007Ae40c3BefC533A1a9308ae9f5fc69FBA5E84";
  const SEPOLIA_ROUTER = "0x03A6b82C1A75ebBF5e4a9c113df92Bff77Ef3845";

  // Chain IDs (LayerZero v2)
  const BSC_CHAIN_ID = 97;     // BSC Testnet
  const SEPOLIA_CHAIN_ID = 40161; // Sepolia


  // 스왑 금액 설정
  const SWAP_AMOUNT = ethers.parseEther("100"); // 100 EDU
  const LZ_FEE = ethers.parseEther("0.01"); // 0.01 BNB/ETH for LayerZero fee

  let token, router, dstChainId;
  if (chainId === BSC_CHAIN_ID) {
    console.log("Swapping from BSC to Sepolia...");
    token = await ethers.getContractAt("MockEDUToken", BSC_TOKEN);
    router = await ethers.getContractAt("EDUSwapRouter", BSC_ROUTER);
    dstChainId = SEPOLIA_CHAIN_ID;
  } else if (chainId === SEPOLIA_CHAIN_ID) {
    console.log("Swapping from Sepolia to BSC...");
    token = await ethers.getContractAt("MockEDUToken", SEPOLIA_TOKEN);
    router = await ethers.getContractAt("EDUSwapRouter", SEPOLIA_ROUTER);
    dstChainId = BSC_CHAIN_ID;
  } else {
    throw new Error("Unsupported network");
  }

  // 토큰 잔액 확인
  const balance = await token.balanceOf(deployer.address);
  console.log("Token balance before swap:", ethers.formatEther(balance), "EDU");

  // 토큰 승인
  console.log("Approving tokens...");
  const approveTx = await token.approve(await router.getAddress(), SWAP_AMOUNT);
  await approveTx.wait();
  console.log("Tokens approved");

  // 크로스체인 스왑 실행
  console.log("Executing cross-chain swap...", dstChainId);

  // LayerZero 옵션 설정
  let adapterParams = ethers.solidityPacked(
    ['uint16', 'uint', 'uint', 'address'],
    [2, 200000, 55555555555, '0x1234512345123451234512345123451234512345']
  );
  console.log("\n⚙️ LayerZero 어댑터 파라미터:", adapterParams);

  const [nativeFee, lzTokenFee] = await router.estimateFee(dstChainId, SWAP_AMOUNT, adapterParams);
  console.log("💸 예상 네이티브 수수료:", ethers.formatEther(nativeFee), "BNB/ETH");
  
  // const swapTx = await router.swap(
  //   deployer.address, // 수신자 주소
  //   SWAP_AMOUNT,      // 스왑 금액
  //   dstChainId,       // 대상 체인 ID
  //   { value: LZ_FEE } // LayerZero 수수료
  // );
  // await swapTx.wait();
  // console.log("Swap transaction sent!");

  // 토큰 잔액 다시 확인
  const balanceAfter = await token.balanceOf(deployer.address);
  console.log("Token balance after swap:", ethers.formatEther(balanceAfter), "EDU");
  console.log("Please check the destination chain for the received tokens.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 