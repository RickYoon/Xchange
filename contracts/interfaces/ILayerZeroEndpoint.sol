// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILayerZeroEndpoint {
    struct MessagingFee {
        uint256 nativeFee;
        uint256 lzTokenFee;
    }

    function send(
        uint32 _dstEid,
        bytes calldata _destination,
        bytes calldata _message,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata _adapterParams
    ) external payable;

    function quote(
        uint32 _dstEid,
        address _sender,
        bytes calldata _message,
        bytes calldata _adapterParams,
        bool _payInLzToken
    ) external view returns (MessagingFee memory);

    function setLzToken(address _lzToken) external;

    function getLzToken() external view returns (address);

    function setDefaultSendVersion(uint16 _version) external;

    function setDefaultReceiveVersion(uint16 _version) external;

    function getSendVersion(address _sender) external view returns (uint16);

    function getReceiveVersion(
        address _receiver
    ) external view returns (uint16);

    function setSendVersion(address _sender, uint16 _version) external;

    function setReceiveVersion(address _receiver, uint16 _version) external;

    function forceResumeReceive(uint32 _srcEid, bytes calldata _path) external;
}
