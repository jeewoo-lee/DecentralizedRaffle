const { developmentChains, networkConfig } = require("./helper-hardhat-config")
const { getNamedAccounts, getSigners, network, ethers } = require("hardhat")

module.exports = [
    networkConfig[network.config.chainId].vrfCoordinatorV2,
    "0x57955836009c74b6d3516c12Af3663326296B048", // nft address
    "0x0a07e421501626dbce33144cbc28451d5d17baf9", // owner
    networkConfig[network.config.chainId]["entranceFee"],
    ethers.utils.parseEther("0.5"),
    3, //raffleId
    120,
    "0x62844E4c8F53aFB38d80b454F49EE9462248734c", // raffleFactory
]
