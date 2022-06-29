const { network, ethers } = require("hardhat")
const { verify } = require("../utils/verify")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")

console.log("??")
const MIN_INPUT = ethers.utils.parseEther("0.1")
const FUND_AMOUNT = "1000000000000000000000"
console.log("???")
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let vrfCoordinatorV2Address, subscriptionId

    console.log("fdffd")
    const gasLane = networkConfig[chainId]["gasLane"]
    const entranceFee = networkConfig[chainId]["entranceFee"]
    const callbackGasLimit = networkConfig[chainId].callbackGasLimit

    console.log(gasLane, entranceFee, callbackGasLimit)

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await transactionResponse.wait(1)
        subscriptionId = transactionReceipt.events[0].args.subId
        console.log("mock vrf deployed")
        // Fund the subscription
        // Usually, you'd need the link token on a real network        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT)
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2
        subscriptionId = networkConfig[chainId].subscriptionId
    }
    log("got here")

    const raffleFactory = await deploy("RaffleFactory", {
        from: deployer,
        args: [MIN_INPUT, vrfCoordinatorV2Address, gasLane, subscriptionId, callbackGasLimit],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log("got here2")

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(raffle.address, arguments)
    }
    log("-------------------------------------------------------------")

    log("done!")
}

module.exports.tags = ["all", "raffle"]
