const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

const ITEM_PRICE = ethers.parseEther("1")
const INTERVAL = 120

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", function () {
          let raffleFactory, raffleFactoryContract, vrfCoordinatorV2Mock, raffleMinInput, deployer
          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[1]
              await deployments.fixture(["mocks", "raffle"])
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
              raffleFactoryContract = await ethers.getContract("raffle")
              raffleFactory = raffleFactoryContract.connect(deployer)
              raffleMinInput = await raffleFactory.minInput()
          })

          describe("constructor", function () {
              it("correctly initialized", async () => {
                  console.log((await raffleFactory.minInput()).toString())
                  assert.equal(
                      networkConfig[network.config.chainId]["fee"],
                      raffleMinInput.toString()
                  )
              })
          })

          describe("createRaffle", function () {
              it("correctly deploys raffle contract", async () => {
                  await raffleFactory.createRaffle(ITEM_PRICE, INTERVAL)
                  const theAddress = await raffleFactory.raffles[0]
                  console.log(theAddress.toString)
                  assert(address(0) != theAddress)
                  const raffleContract = await ethers.getContractAt(theAddress)
                  assert(raffleContract.i_minInputMoney(), raffleMinInput)
              })
          })
      })
