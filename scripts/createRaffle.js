const { getNamedAccounts, getSigners, network, ethers } = require("hardhat")
const { verify } = require("../utils/verify")
const { writeFile } = require("../utils/fs")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
require("dotenv").config()

const ITEM_PRICE = ethers.utils.parseEther("0.5")
const INTERVAL = 120
const contractABI = require("../deployments/rinkeby/RaffleFactory.json")
const filePath = "/Users/leejeewoo/Elysia/Raffle/miscellaneous/.testRaffleAddress"

async function createRaffle() {
    const { deployer } = await getNamedAccounts()
    console.log("deployer?:", deployer.toString())
    // const raffleFactory = await ethers.getContractAt(
    //     "RaffleFactory",
    //     "0x6c6c003eC4F84cc79152fA84B782BD6dd81fB4B9"
    // )

    const alchemyProvider = new ethers.providers.AlchemyProvider("rinkeby", process.env.RINKEBY_API)

    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, alchemyProvider)

    const raffleFactory = new ethers.Contract(
        "0x6c6c003eC4F84cc79152fA84B782BD6dd81fB4B9",
        contractABI.abi,
        signer
    )
    console.log("Raffle Factory Address:", raffleFactory.address)

    if (process.env.CREATE_NEW_RAFFLE == "false") {
        console.log("end this")
        return
    }
    const raffleId = await raffleFactory.raffleId()
    await raffleFactory.createRaffle(ITEM_PRICE, INTERVAL)
    console.log("New Raffle Deployed!")
    const theAddress = await raffleFactory.raffles(raffleId - 1)
    console.log("address:", theAddress)
    raffleContract = await ethers.getContractAt("Raffle", theAddress)
    writeFile(filePath, theAddress)

    /**
     * For Verification.
     */
    const vrfCoordinatorV2Address = networkConfig[network.config.chainId].vrfCoordinatorV2
    const entranceFee = networkConfig[network.config.chainId]["entranceFee"] // minInput
    const nftAddress = await raffleFactory.nftAddress()
    owner = await raffleContract.i_owner()

    const arguments = [
        vrfCoordinatorV2Address,
        nftAddress,
        owner,
        entranceFee,
        ITEM_PRICE,
        raffleId,
        INTERVAL,
        "0x6c6c003eC4F84cc79152fA84B782BD6dd81fB4B9",
    ]

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        console.log("Verifying...")
        await verify(raffleContract.address, arguments)
    }

    console.log("Owner:", owner.toString())
    console.log("Raffle Address:", theAddress.toString())
}

createRaffle()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
