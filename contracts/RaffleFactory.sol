// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./Raffle.sol";

contract RaffleFactory {
    mapping(address => string) public raffles; //the contract address to name of the raffle
    public uint256 raffleId;

}