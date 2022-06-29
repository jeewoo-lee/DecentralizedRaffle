const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { sqrt } = require("../../utils/math")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Staging Test", function () {
          let raffleFactory, raffleMinInput, deployer, raffleContract, nftContract, owner
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              raffleFactory = await ethers.getContract("RaffleFactory", deployer)

              /**
               * NFT Contract
               */

              const nftAddress = await raffleFactory.nftAddress()
              nftContract = await ethers.getContractAt("NFT", nftAddress)

              /**
               * create raffle contract for testing purposes later on.
               */

              await raffleFactory.createRaffle(ITEM_PRICE, INTERVAL)
              const theAddress = await raffleFactory.raffles(0)
              raffleContract = await ethers.getContractAt("Raffle", theAddress)
              owner = await raffleContract.i_owner()
              console.log("Owner:", owner)
          })
      })
