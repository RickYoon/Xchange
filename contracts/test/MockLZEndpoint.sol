// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ILayerZeroEndpoint.sol";

contract MockLZEndpoint is ILayerZeroEndpoint {
    uint16 public constant SEND_VERSION = 1;
    uint16 public constant RECEIVE_VERSION = 1;

    mapping(address => uint256) public nativeFees;
    mapping(address => uint256) public lzTokenFees;

    function send(
        uint32 _dstEid,
        bytes calldata _destination,
        bytes calldata _message,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata _adapterParams
    ) external payable {
        // 실제 메시지 전송 없이 수수료만 기록
        nativeFees[msg.sender] += msg.value;
    }

    function quote(
        uint32 _dstEid,
        address _sender,
        bytes calldata _message,
        bytes calldata _adapterParams,
        bool _payInLzToken
    ) external view returns (MessagingFee memory) {
        // 고정된 수수료 반환
        return MessagingFee(0.01 ether, 0);
    }

    function setLzToken(address _lzToken) external {}

    function getLzToken() external view returns (address) {
        return address(0);
    }

    function setDefaultSendVersion(uint16 _version) external {}

    function setDefaultReceiveVersion(uint16 _version) external {}

    function getSendVersion(address) external pure returns (uint16) {
        return SEND_VERSION;
    }

    function getReceiveVersion(address) external pure returns (uint16) {
        return RECEIVE_VERSION;
    }

    function setSendVersion(address, uint16) external {}

    function setReceiveVersion(address, uint16) external {}

    function forceResumeReceive(uint32, bytes calldata) external {}
}
