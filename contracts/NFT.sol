// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "base64-sol/base64.sol";
import "hardhat/console.sol";
import "./RaffleFactory.sol";

struct TokenData {
    uint256 lowVal;
    uint256 highVal;
    uint256 sqAmount;
    uint256 amountDeposited;
    uint256 raffleId;
}

error NFT__InvalidRaffleAddress();
error NFT__InvalidTokenId();

contract NFT is ERC721, Ownable {
    uint256 private i_mintFee; //will move to raffle contract
    mapping(uint256 => TokenData) private s_tokenIdToTokenData; // tokenId => TokenData instance
    mapping(uint256 => uint256) private s_raffleIdToLastVal; // raffleId =>  Last highVal of the raffle
    mapping(address => uint256) private s_raffleAddresses;
    RaffleFactory i_raffleFactory;

    // address[] public s_nfts;
    uint256 public s_tokenId;

    /* Events */
    event NFT__MINTED();

    constructor(address raffleFactoryAddress) ERC721("Raffle Ticket", "RNFT") {
        s_tokenId = 1;
        i_raffleFactory = RaffleFactory(raffleFactoryAddress);
    }

    // make funcion that creates a "new key" for s_raffleIdToRaffleData
    // this is called by Raffle contract when a new raffle is initiated
    function createRaffleTicket(uint256 _raffleId, address _raffleAddress) public {
        s_raffleIdToLastVal[_raffleId] = 0;
        s_raffleAddresses[_raffleAddress] = 1;
    }

    /*
     * Mints NFT and send it to the user. It adds tokenId to s_tokenIdToTokenData with newly created TokenData instance.
     * This function should be only callable thorugh deployed raffle contracts.
     */
    function mint(
        uint256 _raffleId,
        address _userAddress,
        uint256 _squareDeposited,
        uint256 _amountDeposited
    ) public returns (uint256 id) {
        if (s_raffleAddresses[msg.sender] == 0) {
            revert NFT__InvalidRaffleAddress();
        }
        uint256 lowVal = s_raffleIdToLastVal[_raffleId];
        uint256 highVal = _squareDeposited + lowVal;
        s_tokenIdToTokenData[s_tokenId] = TokenData(
            lowVal,
            highVal,
            _squareDeposited,
            _amountDeposited,
            _raffleId
        );
        _mint(_userAddress, s_tokenId);
        id = s_tokenId;
        s_tokenId++;
        s_raffleIdToLastVal[_raffleId] = highVal;
        emit NFT__MINTED();
    }

    /*
     * getTokenDataOf returns TokenData of given tokenId.
     */
    function getTokenDataOf(uint256 _tokenId) public view returns (TokenData memory tokenData) {
        if (_tokenId < 1 || _tokenId >= s_tokenId) {
            revert NFT__InvalidTokenId();
        }
        tokenData = s_tokenIdToTokenData[_tokenId];
    }

    /*
     * getLastValOf returns the last highVal of given raffleId.
     * This function will be used to calculate chances of winning and choosing the random word.
     */
    function getLastValOf(uint256 _raffleId) public view returns (uint256 lastVal) {
        lastVal = s_raffleIdToLastVal[_raffleId];
    }

    /*
     * getAmountDepositedOf returns the amountDeposited in exchange of given tokenId.
     * This function will be used in displaying information of the NFT.
     */
    function getAmountDepostiedOf(uint256 _tokenId) public view returns (uint256 amountDeposited) {
        if (_tokenId < 1 || _tokenId >= s_tokenId) {
            revert NFT__InvalidTokenId();
        }
        amountDeposited = s_tokenIdToTokenData[_tokenId].amountDeposited;
    }
}
