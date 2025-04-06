// SPDX-License-Identifier: CC BY-NC-SA 4.0
pragma solidity ^0.8.20;

interface IEDUSwapPool {
    function deposit(uint256 amount) external;
    function withdraw(address to, uint256 amount) external;
    function setRouter(address router) external;
}
