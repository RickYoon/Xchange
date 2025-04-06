// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./EDUSwapPool.sol";

/**
 * @title EDUSwapReceiver
 * @dev 크로스체인 EDU 토큰 스왑을 위한 수신자 컨트랙트
 */
contract EDUSwapReceiver is Ownable, OApp {
    EDUSwapPool public pool;

    event PoolSet(address indexed pool);
    event TokensReceived(address indexed to, uint256 amount);

    constructor(
        address _endpoint,
        address _pool,
        address initialOwner
    ) Ownable() OApp(_endpoint, initialOwner) {
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
     * @notice LayerZero 메시지 수신 및 처리
     * @param _origin 송신 체인 정보
     * @param _guid 메시지 고유 식별자
     * @param _payload 수신한 데이터 (to, amount)
     * @param _executor 실행자 주소
     * @param _extraData 추가 데이터
     */
    function _lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _payload,
        address _executor,
        bytes calldata _extraData
    ) internal override {
        require(peers[_origin.srcEid] == _origin.sender, "Invalid source peer");

        // 메시지 디코딩 수정
        (address sender, address recipient, uint256 amount) = abi.decode(
            _payload,
            (address, address, uint256)
        );

        // Pool에서 토큰 인출
        pool.withdrawTo(recipient, amount);
        emit TokensReceived(recipient, amount);
    }

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
}
