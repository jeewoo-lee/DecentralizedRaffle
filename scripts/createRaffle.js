const { network, ethers } = require("hardhat")
const { verify } = require("../utils/verify")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")

async function createRaffle() {
    const deployer = (await getNamedAccounts()).deployer
    const raffleFactory = await ethers.getContract("RaffleFactory", deployer)
    await raffleFactory.createRaffle(ITEM_PRICE, INTERVAL)
    const theAddress = await raffleFactory.raffles(0)
    raffleContract = await ethers.getContractAt("Raffle", theAddress)
    owner = await raffleContract.i_owner()

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...")
        await verify(raffleFactory.address, [ITEM_PRICE, INTERVAL])
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
