// SPDX-License-Identifier: CC BY-NC-SA 4.0
pragma solidity ^0.8.20;

import "@layerzerolabs/lz-evm-protocol-v2/contracts/interfaces/ILayerZeroEndpointV2.sol";
import "@layerzerolabs/lz-evm-oapp-v2/contracts/oapp/OApp.sol";
import "./interfaces/IEDUToken.sol";
import "./interfaces/IEDUSwapPool.sol";

contract EDUSwapRouter is OApp {
    IEDUToken public immutable eduToken;
    IEDUSwapPool public immutable swapPool;

    event Swap(
        address indexed sender,
        uint32 dstEid,
        address recipient,
        uint256 amount,
        bytes32 guid
    );

    event ReceiveSwap(
        uint32 srcEid,
        address sender,
        address recipient,
        uint256 amount,
        bytes32 guid
    );

    constructor(
        address _token,
        address _pool,
        address _endpoint,
        address _delegate
    ) OApp(_endpoint, _delegate) {
        eduToken = IEDUToken(_token);
        swapPool = IEDUSwapPool(_pool);
    }

    function swap(
        uint32 _dstEid,
        address _recipient,
        uint256 _amount,
        bytes calldata _options
    ) external payable {
        // Check if peer is set
        require(peers[_dstEid] != bytes32(0), "Peer not set");

        // Transfer tokens from user to pool
        eduToken.transferFrom(msg.sender, address(swapPool), _amount);

        // Prepare the payload
        bytes memory payload = abi.encode(msg.sender, _recipient, _amount);

        // Send message through LayerZero using OApp's _lzSend
        MessagingFee memory fee = _quote(_dstEid, payload, _options, false);
        require(msg.value >= fee.nativeFee, "Insufficient native token");

        MessagingReceipt memory receipt = _lzSend(
            _dstEid,
            payload,
            _options,
            fee,
            payable(msg.sender)
        );

        emit Swap(msg.sender, _dstEid, _recipient, _amount, receipt.guid);
    }

    function estimateFee(
        uint32 _dstEid,
        address _sender,
        address _recipient,
        uint256 _amount,
        bytes memory _options,
        bool _payInZRO
    ) external view returns (MessagingFee memory) {
        require(peers[_dstEid] != bytes32(0), "Peer not set");
        bytes memory payload = abi.encode(_sender, _recipient, _amount);
        return _quote(_dstEid, payload, _options, _payInZRO);
    }

    function _lzReceive(
        Origin calldata _origin, // struct containing info about the message sender
        bytes32 _guid, // global packet identifier
        bytes calldata payload, // encoded message payload being received
        address _executor, // the Executor address.
        bytes calldata _extraData // arbitrary data appended by the Executor
    ) internal override {
        // data = abi.decode(payload, (string)); // your logic here
    }

    function withdrawNative() external {
        require(msg.sender == owner(), "Only owner");
        (bool success, ) = owner().call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }
}
