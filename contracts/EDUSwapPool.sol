// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title EDUSwapPool
 * @dev 크로스체인 EDU 토큰 스왑을 위한 유동성 풀 컨트랙트
 */
contract EDUSwapPool is Ownable, ReentrancyGuard {
    IERC20 public eduToken;
    address public receiver;
    address public treasury;
    address public router;
    uint256 public totalLPFees;

    event LiquidityDeposited(address indexed owner, uint256 amount);
    event LiquidityWithdrawn(address indexed owner, uint256 amount);
    event TokensWithdrawn(address indexed to, uint256 amount);
    event FeeDistributed(uint256 amount);
    event RouterSet(address indexed router);

    constructor(address _eduToken) Ownable() {
        eduToken = IERC20(_eduToken);
        treasury = msg.sender; // 초기 treasury를 배포자로 설정
    }

    /**
     * @dev Router 컨트랙트 주소 설정
     * @param _router 새로운 Router 컨트랙트 주소
     */
    function setRouter(address _router) external onlyOwner {
        require(_router != address(0), "Invalid router address");
        router = _router;
        emit RouterSet(_router);
    }

    /**
     * @dev Receiver 컨트랙트 주소 설정
     * @param _receiver 새로운 Receiver 컨트랙트 주소
     */
    function setReceiver(address _receiver) external onlyOwner {
        require(_receiver != address(0), "Invalid receiver address");
        receiver = _receiver;
    }

    /**
     * @dev Treasury 주소 설정
     * @param _treasury 새로운 Treasury 주소
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury address");
        treasury = _treasury;
    }

    /**
     * @dev 운영자가 유동성을 예치하는 함수
     * @param amount 예치할 EDU 토큰 수량
     */
    function depositLiquidity(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(
            eduToken.transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        emit LiquidityDeposited(msg.sender, amount);
    }

    /**
     * @dev 운영자가 유동성을 회수하는 함수
     * @param amount 회수할 EDU 토큰 수량
     */
    function adminWithdraw(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(
            eduToken.balanceOf(address(this)) >= amount,
            "Insufficient balance"
        );
        require(eduToken.transfer(msg.sender, amount), "Transfer failed");
        emit LiquidityWithdrawn(msg.sender, amount);
    }

    /**
     * @dev Receiver 컨트랙트만 호출 가능한 출금 함수
     * @param to 토큰을 받을 주소
     * @param amount 전송할 EDU 토큰 수량
     */
    function withdrawTo(address to, uint256 amount) external nonReentrant {
        require(msg.sender == receiver, "Only receiver can withdraw");
        require(to != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be greater than 0");
        require(
            eduToken.balanceOf(address(this)) >= amount,
            "Insufficient balance"
        );
        require(eduToken.transfer(to, amount), "Transfer failed");
        emit TokensWithdrawn(to, amount);
    }

    /**
     * @notice 스왑 수수료를 treasury로 전송
     * @param feeAmount 수수료 금액
     */
    function distributeFee(uint256 feeAmount) external {
        require(
            msg.sender == router || msg.sender == receiver,
            "Only router or receiver can distribute fee"
        );
        require(feeAmount > 0, "Zero fee");
        require(
            eduToken.balanceOf(address(this)) >= feeAmount,
            "Insufficient fee balance"
        );

        // treasury로 수수료 전송
        eduToken.transfer(treasury, feeAmount);

        emit FeeDistributed(feeAmount);
    }

    /**
     * @dev 누적된 수수료 회수
     */
    function withdrawFees() external onlyOwner nonReentrant {
        uint256 amount = totalLPFees;
        require(amount > 0, "No fees to withdraw");
        totalLPFees = 0;
        require(eduToken.transfer(msg.sender, amount), "Transfer failed");
        emit LiquidityWithdrawn(msg.sender, amount);
    }
}
