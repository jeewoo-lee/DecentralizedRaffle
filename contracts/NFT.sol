// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "base64-sol/base64.sol";
import "hardhat/console.sol";

struct RaffleData {
    uint256 lowVal;
    uint256 highVal;
    uint256 amountDeposited;
    uint256 squaredDposited;
    uint256 raffleId;
    address raffleAddress;
}

contract NFT is ERC721, Ownable {
    uint256 private s_last_val;
    uint256 private i_mintFee; //will move to raffle contract
    mapping(uint256 => uint256) private s_raffleToLastVals; // raffleId => lastVal
    mapping(uint256 => RaffleData) private s_idToRaffleData;
    // address[] public s_nfts;
    uint256 public s_tokenId;

    constructor() ERC721("Raffle Ticket", "RNFT") {
        s_tokenId = 0;
    }

    // make funcion that creates "new keys" for s_raffleToLastVals, s_idToRaffleData
}
