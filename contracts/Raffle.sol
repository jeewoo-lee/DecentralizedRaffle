// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";
import "./NFT.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "./RaffleFactory.sol";

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

    /* raffle */
    bool public s_canUserWithdraw;
    NFT private immutable i_nft;
    RaffleFactory private immutable i_raffleFactory;
    uint256 public immutable i_minInputMoney;
    uint256 private s_time;
    uint256 public s_total_deposited = 0;
    uint256 public s_squared_total = 0;
    uint256 public immutable i_item_price;
    uint256 public s_winNum;
    address public immutable i_owner; // might be removed later.
    mapping(uint256 => uint256) private deposits; // tokenid to amount deposited
    RaffleState public s_raffleState;

    /* events */
    event RequestedRaffleWinner(uint256 indexed requestId);
    event RaffleEnter(address indexed player, uint256 amount);
    event WinnerPicked(uint256 indexed winNum);
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
        address raffleFactory
    ) VRFConsumerBaseV2(vrfCoordinatorV2) {
        i_nft = NFT(nft);
        i_raffleFactory = RaffleFactory(raffleFactory);
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_minInputMoney = _minInput;
        s_raffleState = RaffleState(true, _interval, _raffleID);
        i_item_price = _itemPrice;
        s_time = block.timestamp;
        i_owner = _owner;
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
            i_raffleFactory.i_gasLane(),
            i_raffleFactory.i_subscriptionId(),
            i_raffleFactory.REQUEST_CONFIRMATIONS(),
            i_raffleFactory.i_callbackGasLimit(),
            i_raffleFactory.NUM_WORDS()
        );
        emit RequestedRaffleWinner(requestId);
    }

    /**
     * fulfillRandomWords is called by Chainlink VRF after performUpkeep calls requestRandomWords from vrfCoordinator.
     */

    function fulfillRandomWords(
        uint256, /*requestId*/
        uint256[] memory randomWords
    ) internal override {
        s_winNum = randomWords[0] % (i_nft.getLastValOf(s_raffleState.raffleId) - 1); //100 should be lastval from NFT.sol
        // s_lastTimeStamp = block.timestamp;
        (bool success, ) = i_owner.call{value: address(this).balance}("");
        if (!success) {
            revert Raffle__TransferFailed();
        }
        emit WinnerPicked(randomWords[0]);
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
        s_squared_total += Math.sqrt(msg.value);

        // call NFT.sol's minting function here
        uint256 id = i_nft.mint(
            s_raffleState.raffleId,
            msg.sender,
            Math.sqrt(msg.value),
            msg.value
        );
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
        if (s_raffleState.isOpen || s_canUserWithdraw) {
            isWinner = false;
        }
        uint256 lowVal = i_nft.getTokenDataOf(_tokenId).lowVal;
        uint256 highVal = i_nft.getTokenDataOf(_tokenId).highVal;

        if (lowVal <= s_winNum && s_winNum < highVal) {
            isWinner = true;
        } else {
            isWinner = false;
        }
    }
}
