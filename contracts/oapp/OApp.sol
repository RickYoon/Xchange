// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IOApp.sol";
import "../interfaces/ILayerZeroEndpoint.sol";

abstract contract OApp is IOApp {
    ILayerZeroEndpoint public immutable override endpoint;
    address public override delegate;
    mapping(uint32 => bytes32) public override peers;

    constructor(address _endpoint) {
        endpoint = ILayerZeroEndpoint(_endpoint);
        delegate = msg.sender;
    }

    function setPeer(uint32 _eid, bytes32 _peer) external virtual override {
        require(msg.sender == delegate, "OApp: caller must be delegate");
        peers[_eid] = _peer;
    }

    function setDelegate(address _delegate) external virtual override {
        require(msg.sender == delegate, "OApp: caller must be delegate");
        delegate = _delegate;
    }

    function lzSend(
        uint32 _dstEid,
        bytes memory _message,
        bytes memory _options,
        ILayerZeroEndpoint.MessagingFee memory _fee,
        address payable _refundAddress
    ) external virtual override {
        _internalLzSend(_dstEid, _message, _options, _fee, _refundAddress);
    }

    function quote(
        uint32 _dstEid,
        bytes memory _message,
        bytes memory _options,
        bool _payInLzToken
    )
        external
        view
        virtual
        override
        returns (ILayerZeroEndpoint.MessagingFee memory)
    {
        return _internalQuote(_dstEid, _message, _options, _payInLzToken);
    }

    function lzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) external virtual override {
        _internalLzReceive(_origin, _guid, _message, _executor, _extraData);
    }

    function _internalLzSend(
        uint32 _dstEid,
        bytes memory _message,
        bytes memory _options,
        ILayerZeroEndpoint.MessagingFee memory _fee,
        address payable _refundAddress
    ) internal virtual {
        endpoint.send{value: _fee.nativeFee}(
            _dstEid,
            bytes(""),
            _message,
            _refundAddress,
            address(0),
            _options
        );
    }

    function _internalQuote(
        uint32 _dstEid,
        bytes memory _message,
        bytes memory _options,
        bool _payInLzToken
    ) internal view virtual returns (ILayerZeroEndpoint.MessagingFee memory) {
        return
            endpoint.quote(
                _dstEid,
                address(this),
                _message,
                _options,
                _payInLzToken
            );
    }

    function _internalLzReceive(
        Origin calldata _origin,
        bytes32 _guid,
        bytes calldata _message,
        address _executor,
        bytes calldata _extraData
    ) internal virtual;
}
