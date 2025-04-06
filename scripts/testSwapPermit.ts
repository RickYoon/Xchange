import { ethers } from "hardhat";
import axios from "axios";

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

async function main() {
  // 계정 설정
  const [relayer, user] = await ethers.getSigners();
  console.log("\n🔄 Permit을 사용한 릴레이 스왑 테스트 시작");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📝 릴레이어 주소:", relayer.address);
  console.log("📝 유저 주소:", user.address);

  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  console.log("\n🌐 네트워크 정보:");
  console.log("이름:", network.name);
  console.log("Chain ID:", chainId);

  // 컨트랙트 주소
  const BSC_TOKEN = "0xE53675c56b3393151B6AFd404E0693F0D8BCe3f4";
  const BSC_ROUTER = "0x74aa240D984f4dAd61D335404Ce6528ebaf5EAd2";
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
  } else {
    throw new Error("BSC Testnet에서만 실행 가능합니다");
  }

  // Peer 설정 확인
  const peer = await router.peers(dstChainId);
  console.log("\n🔗 목적지 체인 Peer:", peer);
  if (peer === ethers.ZeroAddress) {
    throw new Error("목적지 체인의 Peer가 설정되지 않았습니다");
  }

  // 토큰 잔액 확인
  const balance = await token.balanceOf(user.address);
  console.log("\n💰 유저의 현재 토큰 잔액:", ethers.formatEther(balance), "EDU");

  try {
    // Permit 서명 생성
    const deadline = Math.floor(Date.now() / 1000) + 3600; // 1시간
    const nonce = await token.nonces(user.address);
    const routerAddress = await router.getAddress();

    // EIP-2612 서명 데이터 생성
    const domain = {
      name: await token.name(),
      version: "1",
      chainId: chainId,
      verifyingContract: await token.getAddress()
    };

    const types = {
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" }
      ]
    };

    const value = {
      owner: user.address,
      spender: routerAddress,
      value: SWAP_AMOUNT,
      nonce: nonce,
      deadline: deadline
    };

    // 유저가 서명
    console.log("\n✍️ Permit 서명 생성 중...");
    const signature = await user.signTypedData(domain, types, value);
    const { v, r, s } = ethers.Signature.from(signature);
    console.log("✅ 서명 완료");

    // LayerZero 옵션 설정
    const adapterParams = ethers.solidityPacked(
      ['uint16', 'uint', 'uint', 'address'],
      [2, 200000, 0, ethers.ZeroAddress]
    );
    console.log("\n⚙️ LayerZero 어댑터 파라미터:", adapterParams);

    const [nativeFee, lzTokenFee] = await router.estimateFee(dstChainId, SWAP_AMOUNT, adapterParams);
    console.log("💸 예상 네이티브 수수료:", ethers.formatEther(nativeFee), "BNB");

    try {
      // 릴레이어가 permit과 swap을 실행
      console.log("\n📝 릴레이어가 permit 실행 중...");
      const permitTx = await token.connect(relayer).permit(
        user.address,
        routerAddress,
        SWAP_AMOUNT,
        deadline,
        v,
        r,
        s
      );
      await permitTx.wait();
      console.log("✅ Permit 실행 완료");

      console.log("\n📝 릴레이어가 스왑 실행 중...");
      const swapTx = await router.connect(relayer).swapWithPermit(
        dstChainId,
        ethers.zeroPadValue(user.address, 32),
        SWAP_AMOUNT,
        adapterParams,
        user.address,
        deadline,
        v,
        r,
        s,
        { value: nativeFee }
      );
      console.log("✅ 스왑 트랜잭션 전송됨!");
      
      const receipt = await swapTx.wait();
      console.log("📝 해시:", receipt.hash);

      // 스왑 모니터링 시작
      const dstRouter = await ethers.getContractAt(
        "EDUSwapRouter",
        SEPOLIA_ROUTER
      );
      
      await monitorSwap(router, dstRouter, receipt, dstChainId);

      // 토큰 잔액 다시 확인
      const balanceAfter = await token.balanceOf(user.address);
      console.log("\n💰 스왑 후 유저의 토큰 잔액:", ethers.formatEther(balanceAfter), "EDU");
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