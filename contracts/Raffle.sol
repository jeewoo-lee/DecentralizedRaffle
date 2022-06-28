// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
import "./NFT.sol";

struct RaffleState {
    bool isOpen;
    uint32 interval;
    uint256 raffleId;
}

error Raffle__NotDone();
error Raffle__NotOwner();
error Raffle__NotCompleted();
error Raffle__NotEnoughMoney();
error Raffle__TransferFailed();
error Raffle__NotOpen();
error Raffle__CannotWithdraw(string m);
error Raffle__UpkeepNotNeeded(uint256 currentBalance, bool raffleState);

contract Raffle is VRFConsumerBaseV2, KeeperCompatibleInterface {
    /* chainlink */
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1; //for requesting random word from chainlinkvrf

    /* raffle */
    bool public s_canUserWithdraw;
    NFT private immutable i_nft;
    uint256 public immutable i_minInputMoney;
    uint256 private s_time;
    uint256 public s_total_deposited = 0;
    uint256 public s_squared_total = 0;
    uint256 public immutable i_item_price;
    uint256 private s_winNum;
    address private immutable s_owner; // might be removed later.
    mapping(uint256 => uint256) private deposits; // tokenid to amount deposited
    RaffleState public s_raffleState;

    /* events */
    event RequestedRaffleWinner(uint256 indexed requestId);
    event RaffleEnter(address indexed player, uint256 amount);
    event WinnerPicked(address indexed player);
    event WinnerAlerted(address indexed player);
    event Withdrawed(address indexed player);
    event LoserAlerted(address indexed player);
    event InadequateFunding(string msg);

    constructor(
        address vrfCoordinatorV2,
        address nft,
        address _owner,
        uint256 _minInput,
        uint256 _itemPrice,
        uint256 _raffleID,
        uint32 _interval,
        bytes32 _gasLane,
        uint64 _subscriptionID,
        uint32 _callbackGasLimit
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_nft = NFT(nft);
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_minInputMoney = _minInput;
        i_gasLane = _gasLane;
        i_subscriptionId = _subscriptionID;
        i_callbackGasLimit = _callbackGasLimit;
        s_raffleState = RaffleState(true, _interval, _raffleID);
        i_item_price = _itemPrice;
        s_time = block.timestamp;
        s_owner = _owner;
        i_nft.createRaffleTicket(_raffleID, address(this));
    }

    /*
     * function checkUpkeep, performupKeepm and fulfillRandomWords are utilzied to keep track of when to close the raffle and
     * choose the random winner.
     */
    function checkUpkeep(
        bytes memory /*checkData*/
    )
        public
        override
        returns (
            bool upkeepNeeded,
            bytes memory /* performData */
        )
    {
        bool isOpen = true == s_raffleState.isOpen;
        bool timePassed = (block.timestamp > (s_raffleState.interval + s_time));
        bool hasBalance = address(this).balance > 0;
        upkeepNeeded = (isOpen && timePassed && hasBalance);
        // test
        // emit RequestedRaffleWinner(1);
    }

    function performUpkeep(
        bytes calldata /*performData*/
    ) external override {
        // Request the random number
        // once we get it, do something with it
        // 2 transaction process
        (bool upkeepNeeded, ) = checkUpkeep("");
        if (!upkeepNeeded) {
            revert Raffle__UpkeepNotNeeded(address(this).balance, s_raffleState.isOpen);
        }

        if (s_total_deposited < i_item_price) {
            s_canUserWithdraw = true;
            s_raffleState.isOpen = false;
            emit InadequateFunding(":(");
        }

        s_raffleState.isOpen = false;
        // emit RequestedRaffleWinner(11);
        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        emit RequestedRaffleWinner(requestId);
    }

    function fulfillRandomWords(
        uint256, /*requestId*/
        uint256[] memory randomWords
    ) internal override {
        s_winNum = randomWords[0] % (i_nft.getLastValOf(s_raffleState.raffleId) - 1); //100 should be lastval from NFT.sol
        // s_lastTimeStamp = block.timestamp;
        // (bool success, ) = recentWinner.call{value: address(this).balance}("");
        // if (!success) {
        //     revert Raffle__TransferFailed();
        // }
        // emit WinnerPicked(recentWinner);
    }

    /*
     * enterRaffle allows users to put money and get a raffle ticket (NFT).
     */
    function enterRaffle() public payable {
        // amount: amount to fund
        // msg.value: amount + fee
        if (msg.value < i_minInputMoney) {
            revert Raffle__NotEnoughMoney();
        }
        if (s_raffleState.isOpen == false) {
            revert Raffle__NotOpen();
        }

        s_total_deposited += msg.value;
        s_squared_total += sqrt(msg.value);

        // call NFT.sol's minting function here
        uint256 id = i_nft.mint(s_raffleState.raffleId, msg.sender, sqrt(msg.value), msg.value);
        deposits[id] += msg.value;
    }

    /*
     * withdraw allows users to withdraw amount they have deposited when the raffle deposit goal hasn’t met in time.
     */
    function withrdaw(uint256 _tokenId) public {
        if (!s_canUserWithdraw) {
            revert Raffle__CannotWithdraw("No one can withdraw yet!");
        }
        if (i_nft.ownerOf(_tokenId) != msg.sender) {
            revert Raffle__CannotWithdraw("You aren't the owner of the ticket!");
        }
        if (deposits[_tokenId] <= 0) {
            revert Raffle__CannotWithdraw("Doesn't have matic to withdraw!");
        }

        s_total_deposited -= deposits[_tokenId];
        (bool success, ) = msg.sender.call{value: address(this).balance}("");

        if (!success) {
            revert Raffle__TransferFailed();
        }
        deposits[_tokenId] = 0;
        emit Withdrawed(msg.sender);
    }

    /*
     * potentialChances calculate potential chances for user to win the raffle
     */
    function potentialChances(uint256 amount) public view returns (uint256 chance) {
        chance = (sqrt(amount)) / (s_squared_total + sqrt(amount));
    }

    /*
     * tokenChances calculate actual chances for the token to win the raffle
     */
    function tokenChances(uint256 tokenId) public view returns (uint256 chance) {
        // get tokenData from NFT contract
        chance = (100 * i_nft.getTokenDataOf(tokenId).sqAmount) / s_squared_total;
    }

    /*
     * checkWin allow people to confirm if they won with NFT they hold.
     */
    function checkWin(uint256 _tokenId) public view returns (bool isWinner) {
        // under construction
        // NFT.ownerOf?
        if (s_raffleState.isOpen) {
            revert Raffle__NotDone();
        }
        if (s_canUserWithdraw) {
            revert Raffle__NotCompleted();
        }
        if (i_nft.ownerOf(_tokenId) != msg.sender) {
            revert Raffle__NotOwner();
        }

        uint256 lowVal = i_nft.getTokenDataOf(_tokenId).lowVal;
        uint256 highVal = i_nft.getTokenDataOf(_tokenId).highVal;

        if (lowVal <= s_winNum && s_winNum < highVal) {
            isWinner = true;
        } else {
            isWinner = false;
        }
    }

    /* utils */
    // babylonian method (https://en.wikipedia.org/wiki/Methods_of_computing_square_roots#Babylonian_method)
    // from https://github.com/Uniswap/v2-core/blob/4dd59067c76dea4a0e8e4bfdda41877a6b16dedc/contracts/libraries/Math.sol#L11-L22
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
