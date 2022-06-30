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

    bytes32 public immutable i_gasLane;
    uint64 public immutable i_subscriptionId;
    uint32 public immutable i_callbackGasLimit;
    uint16 public constant REQUEST_CONFIRMATIONS = 3;
    uint32 public constant NUM_WORDS = 1; //for requesting random word from chainlinkvrf

    constructor(
        uint256 _minInput,
        address _vrfAddress,
        bytes32 _gasLane,
        uint64 _subscriptionID,
        uint32 _callbackGasLimit
    ) {
        NFT theNFT = new NFT(address(this));
        owner = msg.sender; // Whoever deploys smart contract becomes the owner
        minInput = _minInput;
        nftAddress = address(theNFT);
        vrfAddress = _vrfAddress;
        i_gasLane = _gasLane;
        i_subscriptionId = _subscriptionID;
        i_callbackGasLimit = _callbackGasLimit;
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
            address(this)
        );

        raffles[raffleId] = address(theRaffle);
        raffleId++;
    }
}
