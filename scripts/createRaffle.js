const { getNamedAccounts, getSigners, network, ethers } = require("hardhat")
const { verify } = require("../utils/verify")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
require("dotenv").config()

const ITEM_PRICE = ethers.utils.parseEther("0.5")
const INTERVAL = 120
const contractABI = require("../deployments/rinkeby/RaffleFactory.json")

async function createRaffle() {
    const { deployer } = await getNamedAccounts()
    console.log("deployer?:", deployer.toString())
    // const raffleFactory = await ethers.getContractAt(
    //     "RaffleFactory",
    //     "0x6c6c003eC4F84cc79152fA84B782BD6dd81fB4B9"
    // )

    const alchemyProvider = new ethers.providers.AlchemyProvider(
        "rinkeby",
        process.env.RINKEBY_API
    )

    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, alchemyProvider)

    const raffleFactory = new ethers.Contract(
        "0x6c6c003eC4F84cc79152fA84B782BD6dd81fB4B9",
        contractABI.abi,
        signer
    )
    console.log("Raffle Factory Address:", raffleFactory.address)

    
    const raffleId = await raffleFactory.raffleId
    console.log((await raffleFactory.raffleId()))
    if (raffleId == 0) {
        await raffleFactory.createRaffle(ITEM_PRICE, INTERVAL)
        console.log("New Raffle Deployed!");
    }
    const theAddress = await raffleFactory.raffles(0)
    console.log(theAddress);
    raffleContract = await ethers.getContractAt("Raffle", theAddress)
    owner = await raffleContract.i_owner()

    // if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    //     console.log("Verifying...")
    //     await verify(raffleContract.address, [ITEM_PRICE, INTERVAL])
    // }

    console.log("Owner:", owner.toString())
    console.log("Raffle Address:", theAddress.toString())
}

createRaffle()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
