const { developmentChains, networkConfig } = require("./helper-hardhat-config")
const { getNamedAccounts, getSigners, network, ethers } = require("hardhat")

module.exports = [
    networkConfig[network.config.chainId].vrfCoordinatorV2,
    "0xe598b9f221f5e0f65207b1fc23e41e27c1f0fba0", // nft address
    "0x0a07e421501626dbce33144cbc28451d5d17baf9", // owner
    networkConfig[network.config.chainId]["entranceFee"],
    ethers.utils.parseEther("0.006"),
    6, //raffleId
    60,
    "0x6E35456677D17cd3d6d1F0A1C741fF90b632c830", // raffleFactory
]
