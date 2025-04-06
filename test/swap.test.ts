import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("EDUSwap", function () {
    let eduToken: any;
    let pool: any;
    let router: any;
    let receiver: any;
    let lzEndpoint: any;
    let owner: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;

    const MOCK_EID = 2; // BSC 체인 ID
    const INITIAL_SUPPLY = ethers.parseEther("10000000"); // 1000만 EDU
    const INITIAL_LIQUIDITY = ethers.parseEther("100000"); // 10만 EDU

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // Mock LayerZero Endpoint 배포
        const MockLZEndpoint = await ethers.getContractFactory("MockLZEndpoint");
        lzEndpoint = await MockLZEndpoint.deploy();
        await lzEndpoint.waitForDeployment();

        // EDU 토큰 배포
        const EDUToken = await ethers.getContractFactory("MockEDUToken");
        eduToken = await EDUToken.deploy(INITIAL_SUPPLY);
        await eduToken.waitForDeployment();

        // Pool 배포
        const Pool = await ethers.getContractFactory("EDUSwapPool");
        pool = await Pool.deploy(await eduToken.getAddress());
        await pool.waitForDeployment();

        // Router 배포
        const Router = await ethers.getContractFactory("EDUSwapRouter");
        router = await Router.deploy(
            await lzEndpoint.getAddress(),
            await eduToken.getAddress(),
            await pool.getAddress()
        );
        await router.waitForDeployment();

        // Receiver 배포
        const Receiver = await ethers.getContractFactory("EDUSwapReceiver");
        receiver = await Receiver.deploy(await lzEndpoint.getAddress());
        await receiver.waitForDeployment();

        // 컨트랙트 연결 설정
        await pool.setReceiver(await router.getAddress());
        await router.setPool(await pool.getAddress());
        await receiver.setPool(await pool.getAddress());

        // Peer 설정
        const routerAddress = await router.getAddress();
        const receiverAddress = await receiver.getAddress();
        await router.setPeer(MOCK_EID, ethers.zeroPadValue(receiverAddress, 32));
        await receiver.setPeer(MOCK_EID, ethers.zeroPadValue(routerAddress, 32));

        // 사용자에게 토큰 전송
        await eduToken.transfer(user1.address, ethers.parseEther("1000000")); // 100만 EDU
        await eduToken.transfer(user2.address, ethers.parseEther("1000000")); // 100만 EDU

        // 초기 유동성 공급
        await eduToken.approve(await pool.getAddress(), INITIAL_SUPPLY);
        await pool.depositLiquidity(INITIAL_LIQUIDITY);
    });

    describe("초기화", function () {
        it("올바른 초기값이 설정되어야 함", async function () {
            expect(await pool.eduToken()).to.equal(await eduToken.getAddress());
            expect(await pool.receiver()).to.equal(await router.getAddress());
            expect(await router.pool()).to.equal(await pool.getAddress());
            expect(await receiver.pool()).to.equal(await pool.getAddress());
        });

        it("초기 유동성이 올바르게 설정되어야 함", async function () {
            const poolBalance = await eduToken.balanceOf(await pool.getAddress());
            expect(poolBalance).to.equal(INITIAL_LIQUIDITY);
        });
    });

    describe("스왑", function () {
        const swapAmount = ethers.parseEther("1000"); // 1000 EDU

        beforeEach(async function () {
            await eduToken.connect(user1).approve(await router.getAddress(), swapAmount);
        });

        it("금액이 0이면 실패해야 함", async function () {
            await expect(
                router.connect(user1).swap(
                    user1.address,
                    0,
                    MOCK_EID,
                    { value: ethers.parseEther("0.1") }
                )
            ).to.be.revertedWith("Amount must be greater than 0");
        });

        it("스왑 이벤트가 발생해야 함", async function () {
            const tx = await router.connect(user1).swap(
                user1.address,
                swapAmount,
                MOCK_EID,
                { value: ethers.parseEther("0.1") }
            );

            await expect(tx)
                .to.emit(router, "SwapInitiated")
                .withArgs(user1.address, user1.address, swapAmount, MOCK_EID);
        });

        it("수수료가 차감된 금액이 풀로 전송되어야 함", async function () {
            const poolBalanceBefore = await eduToken.balanceOf(await pool.getAddress());
            
            await router.connect(user1).swap(
                user1.address,
                swapAmount,
                MOCK_EID,
                { value: ethers.parseEther("0.1") }
            );

            const poolBalanceAfter = await eduToken.balanceOf(await pool.getAddress());
            const fee = (swapAmount * BigInt(50)) / BigInt(10000); // 0.5% 수수료
            const expectedAmount = swapAmount;

            expect(poolBalanceAfter - poolBalanceBefore).to.equal(expectedAmount);
            expect(await pool.accumulatedFees()).to.equal(fee);
        });
    });

    describe("수수료 추정", function () {
        it("LayerZero 수수료 추정이 올바르게 동작해야 함", async function () {
            const amount = ethers.parseEther("1000");
            const nativeFee = ethers.parseEther("0.01"); // MockLZEndpoint에서 설정한 값

            const fee = await lzEndpoint.quote(
                MOCK_EID,
                await router.getAddress(),
                "0x",
                "0x",
                false
            );

            expect(fee.nativeFee).to.equal(nativeFee);
            expect(fee.lzTokenFee).to.equal(0);
        });
    });
}); 