// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "./Raffle.sol";

error RaffleFactory__NotOwner();
error RaffleFactory__AlreadyCreated();

// address vrfCoordinatorV2,
// uint256 _minInput,
// uint256 _itemPrice,
// uint256 _raffleID,
// uint32 _endTime,
// address _owner,
// bytes32 _gasLane,
// uint64 _subscriptionID,
// uint32 _callbackGasLimit

contract RaffleFactory {
    mapping(address => string) public raffles; //the contract address to name of the raffle
    uint256 public raffleId = 0;
    uint256 public immutable minInput;
    address private immutable owner;

    constructor(uint256 _minInput) {
        owner = msg.sender; // Whoever deploys smart contract becomes the owner
        minInput = _minInput;
    }

    function createRaffle(
        string memory _itemName,
        uint256 _itemPrice
    ) external {
        if (msg.sender != owner) {
            revert RaffleFactory__NotOwner();
        }
        // Raffle theRaffle = new Raffle(_minInput, _itemPrice, raffleId, msg.sender);
        // raffles[address(theRaffle)] = _itemName;
    }
}
