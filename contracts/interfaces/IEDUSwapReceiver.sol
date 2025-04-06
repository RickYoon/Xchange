// SPDX-License-Identifier: CC BY-NC-SA 4.0
pragma solidity ^0.8.20;

interface IEDUSwapReceiver {
    function lzReceive(
        uint16 _srcChainId,
        bytes memory _srcAddress,
        uint64 _nonce,
        bytes memory _payload
    ) external;
}
