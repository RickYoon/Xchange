// SPDX-License-Identifier: CC BY-NC-SA 4.0
pragma solidity ^0.8.20;

import "../interfaces/ILayerZeroEndpoint.sol";

contract MockLZEndpoint is ILayerZeroEndpoint {
    uint16 public constant SEND_VERSION = 1;
    uint16 public constant RECEIVE_VERSION = 1;

    mapping(address => uint256) public nativeFees;
    mapping(address => uint256) public lzTokenFees;

    function send(
        uint16 _dstChainId,
        bytes calldata _destination,
        bytes calldata _payload,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata _adapterParams
    ) external payable override {
        // Mock implementation
    }

    function estimateFees(
        uint16 _dstChainId,
        address _userApplication,
        bytes calldata _payload,
        bool _payInZRO,
        bytes calldata _adapterParams
    ) external pure override returns (uint256 nativeFee, uint256 zroFee) {
        return (0.01 ether, 0);
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
