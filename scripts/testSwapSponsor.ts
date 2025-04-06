import { ethers } from "hardhat";
import axios from "axios";
import { http } from "viem";
import { createZeroDevPaymasterClient, createKernelAccountClient } from "@zerodev/sdk";
import { getEntryPoint } from "@zerodev/sdk/constants";

interface LayerZeroMessage {
  data: [{
    destination: {
      status: string;
      tx: {
        txHash: string;
        blockNumber: number;
        blockTimestamp: number;
      };
    };
    status: {
      name: string;
      message: string;
    };
  }];
}

async function monitorSwap(
  srcRouter: any,
  dstRouter: any,
  swapTx: any,
  dstChainId: number
) {
  console.log("\n⏳ 크로스체인 메시지 전달 진행상황");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  
  let startTime = Date.now();
  console.log("🚀 소스체인 트랜잭션 전송 완료");
  console.log(`📝 트랜잭션 해시: ${swapTx.hash}`);

  // 메시지 전달 상태 모니터링
  let messageDelivered = false;
  let retryCount = 0;
  const maxRetries = 16; // 최대 4분 대기 (15초 * 16)
  const LZ_API_URL = `https://scan-testnet.layerzero-api.com/v1/messages/tx/${swapTx.hash}`;
  const totalWidth = 20; // 게이지 바 전체 길이

  while (!messageDelivered && retryCount < maxRetries) {
    try {
      await new Promise(resolve => setTimeout(resolve, 15000)); // 15초 대기
      retryCount++;
      
      const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(elapsedTime / 60);
      const seconds = elapsedTime % 60;
      
      // 진행률 계산 및 게이지 바 생성
      const progress = Math.min(retryCount / maxRetries, 1);
      const filledWidth = Math.floor(progress * totalWidth);
      const emptyWidth = totalWidth - filledWidth;
      const progressBar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);
      const progressPercent = Math.floor(progress * 100);
      
      console.clear(); // 이전 출력 지우기
      console.log("\n⏳ 크로스체인 메시지 전달 진행상황");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`📝 트랜잭션 해시: ${swapTx.hash}`);
      console.log(`\n⌛ 경과 시간: ${minutes}분 ${seconds}초`);
      console.log(`[${progressBar}] ${progressPercent}%`);
      
      // LayerZero API를 통해 메시지 상태 확인
      const response = await axios.get<LayerZeroMessage>(LZ_API_URL);
      const messageData = response.data.data[0];
      
      if (messageData) {
        console.log(`\n📊 메시지 상태: ${messageData.status.name}`);
        console.log(`💬 상세 정보: ${messageData.status.message}`);
        
        if (messageData.destination.status === "SUCCEEDED") {
          messageDelivered = true;
          console.log("\n✅ 메시지 전달 완료!");
          console.log(`⏱️ 총 소요시간: ${minutes}분 ${seconds}초`);
          console.log(`🎯 목적지 트랜잭션: ${messageData.destination.tx.txHash}`);
          break;
        } else if (messageData.destination.status === "WAITING") {
          console.log("\n⏳ 메시지 전달 대기중");
        } else if (messageData.destination.status === "FAILED") {
          console.log("\n❌ 메시지 전달 실패!");
          console.log(`💬 실패 사유: ${messageData.status.message}`);
          break;
        }
      }
      
    } catch (error) {
      console.log("\n🔍 상태 확인 중 오류 발생, 재시도 중...");
    }
  }

  if (!messageDelivered) {
    console.log("\n⚠️ 시간 초과: 메시지 전달이 아직 완료되지 않았습니다.");
    console.log("💡 LayerZero 익스플로러에서 수동으로 확인해주세요:");
    console.log(`🔗 https://testnet.layerzeroscan.com/tx/${swapTx.hash}`);
  }
}

// ZeroDev 설정
const ZERODEV_PROJECT_ID = process.env.ZERODEV_PROJECT_ID || ""; // .env 파일에서 설정 필요
const ZERODEV_RPC = `https://rpc.zerodev.app/api/v2/bsc-testnet/${ZERODEV_PROJECT_ID}`;

async function setupGasSponsorship(userAddress: string) {
  const chain = {
    id: 97, // BSC Testnet
    name: 'BSC Testnet',
    network: 'bsc-testnet',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    rpcUrls: {
      default: { http: ['https://data-seed-prebsc-1-s1.binance.org:8545'] },
    },
  };

  const entryPoint = getEntryPoint("0.7");

  // ZeroDev Paymaster 클라이언트 생성
  const paymasterClient = createZeroDevPaymasterClient({
    chain,
    transport: http(ZERODEV_RPC),
  });

  // Kernel 계정 클라이언트 생성
  const kernelClient = createKernelAccountClient({
    chain,
    bundlerTransport: http(ZERODEV_RPC + "?provider=ULTRA_RELAY"),
    account: {
      address: userAddress,
    },
    paymaster: {
      getPaymasterData: async (userOperation: any) => {
        try {
          return await paymasterClient.sponsorUserOperation({
            userOperation,
          });
        } catch (error) {
          console.error("가스 스폰서십 오류:", error);
          return {}; // 스폰서십 실패시 유저가 가스비 지불
        }
      },
    },
    userOperation: {
      estimateFeesPerGas: async ({ bundlerClient }: any) => {
        return {
          maxFeePerGas: BigInt(0),
          maxPriorityFeePerGas: BigInt(0),
        };
      },
    },
  });

  return kernelClient;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("\n🔄 스폰서 모드로 스왑 테스트 시작");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📝 계정 주소:", deployer.address);

  // ZeroDev 가스 스폰서십 설정
  console.log("\n🔧 가스 스폰서십 설정 중...");
  const kernelClient = await setupGasSponsorship(deployer.address);
  console.log("✅ 가스 스폰서십 설정 완료");

  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  console.log("\n🌐 네트워크 정보:");
  console.log("이름:", network.name);
  console.log("Chain ID:", chainId);

  // 컨트랙트 주소
  const BSC_TOKEN = "0xE39331eCe138462a8974c8315Ac455885d4b6369";
  const BSC_ROUTER = "0xeF9b375711163031009Fc7Ab1FA54E4CF7aE266B";
  const SEPOLIA_TOKEN = "0xF007Ae40c3BefC533A1a9308ae9f5fc69FBA5E84";
  const SEPOLIA_ROUTER = "0x53839925DBaeF11976F9c8b1f63649d12f84F101";

  // Chain IDs (LayerZero v2)
  const BSC_CHAIN_ID = 40102;     // BSC Testnet
  const SEPOLIA_CHAIN_ID = 40161; // Sepolia

  // 스왑 금액 설정
  const SWAP_AMOUNT = ethers.parseEther("100"); // 100 EDU

  let token, router, dstChainId;
  if (chainId === 97) { // BSC Testnet
    console.log("\n🔄 BSC -> Sepolia 스왑 준비 중...");
    token = await ethers.getContractAt("MockEDUToken", BSC_TOKEN);
    router = await ethers.getContractAt("EDUSwapRouter", BSC_ROUTER);
    dstChainId = SEPOLIA_CHAIN_ID;
  } else if (chainId === 11155111) { // Sepolia
    console.log("\n🔄 Sepolia -> BSC 스왑 준비 중...");
    token = await ethers.getContractAt("MockEDUToken", SEPOLIA_TOKEN);
    router = await ethers.getContractAt("EDUSwapRouter", SEPOLIA_ROUTER);
    dstChainId = BSC_CHAIN_ID;
  } else {
    throw new Error("지원하지 않는 네트워크입니다");
  }

  // Peer 설정 확인
  const peer = await router.peers(dstChainId);
  console.log("\n🔗 목적지 체인 Peer:", peer);
  if (peer === ethers.ZeroAddress) {
    throw new Error("목적지 체인의 Peer가 설정되지 않았습니다");
  }

  // 토큰 잔액 확인
  const balance = await token.balanceOf(deployer.address);
  console.log("\n💰 현재 토큰 잔액:", ethers.formatEther(balance), "EDU");

  // 토큰 승인
  console.log("\n✍️ 토큰 승인 중...");
  const approveTx = await token.approve(await router.getAddress(), SWAP_AMOUNT);
  await approveTx.wait();
  console.log("✅ 토큰 승인 완료");

  try {
    // LayerZero 옵션 설정
    const adapterParams = ethers.solidityPacked(
      ['uint16', 'uint', 'uint', 'address'],
      [2, 200000, 0, ethers.ZeroAddress]
    );
    console.log("\n⚙️ LayerZero 어댑터 파라미터:", adapterParams);

    const [nativeFee, lzTokenFee] = await router.estimateFee(dstChainId, SWAP_AMOUNT, adapterParams);
    console.log("💸 예상 네이티브 수수료:", ethers.formatEther(nativeFee), "BNB/ETH");

    try {
      // 가스 추정
      const gasEstimate = await router.swap.estimateGas(
        dstChainId,
        ethers.zeroPadValue(deployer.address, 32),
        SWAP_AMOUNT,
        adapterParams,
        { value: nativeFee }
      );
      console.log("⛽ 예상 가스:", gasEstimate.toString());

      // 스폰서된 트랜잭션 생성
      console.log("\n📝 스폰서 트랜잭션 준비 중...");
      const userOp = await kernelClient.prepareUserOperationRequest({
        target: router.address,
        data: router.interface.encodeFunctionData("swap", [
          dstChainId,
          ethers.zeroPadValue(deployer.address, 32),
          SWAP_AMOUNT,
          adapterParams
        ]),
        value: nativeFee
      });

      // 트랜잭션 전송
      console.log("💫 스폰서된 스왑 트랜잭션 전송 중...");
      const swapTx = await kernelClient.sendUserOperation(userOp);
      console.log("✅ 트랜잭션 전송됨!");
      console.log("📝 해시:", swapTx.hash);

      // 스왑 모니터링 시작
      const dstRouter = await ethers.getContractAt(
        "EDUSwapRouter",
        chainId === 97 ? SEPOLIA_ROUTER : BSC_ROUTER
      );
      
      await monitorSwap(router, dstRouter, swapTx, dstChainId);

      // 토큰 잔액 다시 확인
      const balanceAfter = await token.balanceOf(deployer.address);
      console.log("\n💰 스왑 후 토큰 잔액:", ethers.formatEther(balanceAfter), "EDU");
      console.log("📊 변화량:", ethers.formatEther(balanceAfter.sub(balance)), "EDU");

    } catch (swapError: any) {
      console.error("\n❌ 스왑 실패:");
      if (swapError.error) console.error("오류 상세:", swapError.error);
      if (swapError.errorArgs) console.error("오류 인자:", swapError.errorArgs);
      if (swapError.errorName) console.error("오류 이름:", swapError.errorName);
      if (swapError.errorSignature) console.error("오류 시그니처:", swapError.errorSignature);
      throw swapError;
    }

  } catch (error: any) {
    console.error("\n❌ 작업 실패:");
    if (error.message) console.error("오류 메시지:", error.message);
    if (error.data) console.error("오류 데이터:", error.data);
    if (error.transaction) console.error("트랜잭션:", error.transaction);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 