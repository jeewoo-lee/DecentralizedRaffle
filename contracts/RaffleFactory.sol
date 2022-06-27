// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "./Raffle.sol";
import "./NFT.sol";

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
    mapping(uint256 => address) public raffles; //the contract address to name of the raffle
    uint256 public raffleId = 0;
    uint256 public immutable minInput;
    address public immutable owner;
    address public immutable nftAddress;
    address private immutable vrfAddress;

    bytes32 private immutable gasLane;
    uint64 private immutable subscriptionID;
    uint32 private immutable callbackGasLimit;

    constructor(
        uint256 _minInput,
        address _vrfAddress,
        bytes32 _gasLane,
        uint64 _subscriptionID,
        uint32 _callbackGasLimit
    ) {
        owner = msg.sender; // Whoever deploys smart contract becomes the owner
        minInput = _minInput;
        nftAddress = createNFT();
        vrfAddress = _vrfAddress;
        gasLane = _gasLane;
        subscriptionID = _subscriptionID;
        callbackGasLimit = _callbackGasLimit;
    }

    function createRaffle(uint256 _itemPrice, uint32 _interval) public {
        if (msg.sender != owner) {
            revert RaffleFactory__NotOwner();
        }

        Raffle theRaffle = new Raffle(
            vrfAddress,
            nftAddress,
            owner,
            minInput,
            _itemPrice,
            raffleId,
            _interval,
            gasLane,
            subscriptionID,
            callbackGasLimit
        );

        raffles[raffleId] = address(theRaffle);
        raffleId++;
    }

    function createNFT() internal returns (address) {
        NFT theNFT = new NFT();
        return address(theNFT);
    }
}
