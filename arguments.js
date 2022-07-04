const { developmentChains, networkConfig } = require("./helper-hardhat-config")
const { getNamedAccounts, getSigners, network, ethers } = require("hardhat")

module.exports = [
    networkConfig[network.config.chainId].vrfCoordinatorV2,
    "0xa70fbcd220705b361435fdc08571ec00bb375c4e",
    "0x0a07e421501626dbce33144cbc28451d5d17baf9",
    networkConfig[network.config.chainId]["entranceFee"],
    ethers.utils.parseEther("0.5"),
    12,
    120,
    "0x6c6c003eC4F84cc79152fA84B782BD6dd81fB4B9",
]
