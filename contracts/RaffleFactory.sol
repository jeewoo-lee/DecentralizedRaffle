// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./Raffle.sol";

error RaffleFactory__NotOwner();
error RaffleFactory__AlreadyCreated();

contract RaffleFactory {
    mapping(address => string) public raffles; //the contract address to name of the raffle
    uint256 public raffleId = 0;
    address private immutable owner;

    constructor() {
        owner = msg.sender; // Whoever deploys smart contract becomes the owner
    }

    function createRaffle(
        string memory _itemName,
        uint256 _minInput,
        uint256 _itemPrice
    ) external {
        if (msg.sender != owner) {
            revert RaffleFactory__NotOwner();
        }
        // Raffle theRaffle = new Raffle(_minInput, _itemPrice, raffleId, msg.sender);
        raffles[address(theRaffle)] = _itemName;
    }
}
