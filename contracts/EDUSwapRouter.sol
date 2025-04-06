// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "./EDUSwapPool.sol";
import "./interfaces/IEDUSwapPool.sol";
import "./interfaces/IEDUSwapReceiver.sol";
import "./interfaces/ILayerZeroEndpoint.sol";

/**
 * @title EDUSwapRouter
 * @dev 크로스체인 EDU 토큰 스왑을 위한 라우터 컨트랙트
 */
contract EDUSwapRouter is Ownable, OApp {
    IERC20 public eduToken;
    EDUSwapPool public pool;
    uint16 public constant FEE_BPS = 50; // 0.5% fee

    event SwapInitiated(address indexed from, uint256 amount, uint32 dstEid);
    event PoolSet(address indexed pool);
    event Swap(
        address indexed from,
        uint16 dstChainId,
        bytes32 toAddress,
        uint256 amount
    );

    constructor(
        address _endpoint,
        address _eduToken,
        address _pool,
        address initialOwner
    ) Ownable() OApp(_endpoint, initialOwner) {
        _transferOwnership(initialOwner);
        eduToken = IERC20(_eduToken);
        pool = EDUSwapPool(_pool);
    }

    /**
     * @dev Pool 컨트랙트 주소 설정
     * @param _pool 새로운 Pool 컨트랙트 주소
     */
    function setPool(address _pool) external onlyOwner {
        require(_pool != address(0), "Invalid pool address");
        pool = EDUSwapPool(_pool);
        emit PoolSet(_pool);
    }

    /**
     * @notice 크로스체인 스왑 실행
     * @param _dstEid 목적지 체인 ID
     * @param _to 수신자 주소
     * @param _amount 스왑할 금액
     * @param _options LayerZero 옵션
     */
    function swap(
        uint32 _dstEid,
        bytes32 _to,
        uint256 _amount,
        bytes calldata _options
    ) external payable {
        require(_amount > 0, "Zero amount");
        require(peers[_dstEid] != bytes32(0), "Invalid destination");

        // 수수료 계산
        uint256 fee = (_amount * FEE_BPS) / 10000;
        uint256 amountAfterFee = _amount - fee;

        // 토큰 전송 및 수수료 처리
        require(
            eduToken.transferFrom(msg.sender, address(pool), _amount),
            "Transfer to pool failed"
        );
        pool.distributeFee(fee);

        // LayerZero 메시지 전송
        bytes memory payload = abi.encode(_to, amountAfterFee);
        _lzSend(
            _dstEid,
            payload,
            _options,
            MessagingFee(msg.value, 0),
            payable(msg.sender)
        );

        emit SwapInitiated(msg.sender, _amount, _dstEid);
    }

    /**
     * @notice LayerZero 수수료 추정
     * @param _dstEid 목적지 체인 ID
     * @param _amount 스왑할 금액
     * @param _options LayerZero 옵션
     */
    function estimateFee(
        uint32 _dstEid,
        uint256 _amount,
        bytes calldata _options
    ) external view returns (uint256 nativeFee, uint256 lzTokenFee) {
        bytes memory payload = abi.encode(bytes32(0), _amount);
        MessagingFee memory fee = _quote(_dstEid, payload, _options, false);
        return (fee.nativeFee, fee.lzTokenFee);
    }

    /**
     * @notice LayerZero 메시지 수신 처리
     */
    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _payload,
        address _executor,
        bytes calldata _extraData
    ) internal override {}

    /**
     * @notice 메시지 실패 시 복구 로직
     */
    function _blockingLzReceive(Origin calldata, bytes calldata) internal pure {
        // 실패한 메시지 처리 로직
        revert("Message failed");
    }

    /**
     * @dev 컨트랙트가 받은 네이티브 토큰 인출
     */
    function withdrawNative() external onlyOwner {
        (bool success, ) = msg.sender.call{value: address(this).balance}("");
        require(success, "Native token withdrawal failed");
    }

    function swapWithPermit(
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint256 _amount,
        bytes calldata _adapterParams,
        address owner,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external payable {
        // Permit 실행
        IERC20Permit(address(eduToken)).permit(
            owner,
            address(this),
            _amount,
            deadline,
            v,
            r,
            s
        );

        // 토큰 전송
        require(
            eduToken.transferFrom(owner, address(pool), _amount),
            "Router: Transfer failed"
        );

        // 스왑 실행
        bytes memory payload = abi.encode(_toAddress, _amount);

        // LayerZero 메시지 전송
        ILayerZeroEndpoint(lzEndpoint).send{value: msg.value}(
            _dstChainId,
            peers[_dstChainId],
            payload,
            payable(msg.sender),
            address(0x0),
            _adapterParams
        );

        emit Swap(msg.sender, _dstChainId, _toAddress, _amount);
    }
}
