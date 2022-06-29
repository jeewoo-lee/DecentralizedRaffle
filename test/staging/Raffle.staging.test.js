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
          })
      })
