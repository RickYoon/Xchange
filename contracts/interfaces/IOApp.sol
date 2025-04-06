// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ILayerZeroEndpoint.sol";

interface IOApp {
    struct Origin {
        uint32 srcEid;
        bytes32 sender;
        uint64 nonce;
    }

    function endpoint() external view returns (ILayerZeroEndpoint);

    function delegate() external view returns (address);

    function peers(uint32 _eid) external view returns (bytes32);

    function setPeer(uint32 _eid, bytes32 _peer) external;

    function setDelegate(address _delegate) external;

    function lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) external;

    function lzSend(
        uint32 _dstEid,
        bytes memory _message,
        bytes memory _options,
        ILayerZeroEndpoint.MessagingFee memory _fee,
        address payable _refundAddress
    ) external;

    function quote(
        uint32 _dstEid,
        bytes memory _message,
        bytes memory _options,
        bool _payInLzToken
    ) external view returns (ILayerZeroEndpoint.MessagingFee memory);
}
