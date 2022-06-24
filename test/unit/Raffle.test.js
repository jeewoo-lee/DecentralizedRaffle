const { assert, expect } = require("chai")
const {network, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

const ITEM_PRICE = ethers.utils.parseEther("1")
const INTERVAL = 120

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", function () {
          let raffleFactory, raffleFactoryContract, vrfCoordinatorV2Mock, raffleMinInput, deployer
          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["mocks", "raffle"])
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
              raffleFactoryContract = await ethers.getContract("RaffleFactory")
              raffleFactory = raffleFactoryContract.connect(deployer)
              raffleMinInput = await raffleFactory.minInput()
              console.log("Deployer: ", deployer.address.toString())
          })

          describe("constructor", function () {
              it("correctly initialized", async () => {
                  console.log((await raffleFactory.minInput()).toString())
                  assert.equal(
                      networkConfig[network.config.chainId]["fee"],
                      raffleMinInput.toString()
                  )
              })
              it("creates nft contract", async() => {
                const nftAddress = await raffleFactory.nftAddress()
                console.log("NFT:", nftAddress.toString());
                expect(nftAddress).to.not.equal(0)
              })
          })

          describe("createRaffle", function () {
              it("correctly deploys raffle contract", async () => {
                  console.log((await raffleFactory.owner()).toString())
                  await raffleFactory.createRaffle(ITEM_PRICE, INTERVAL)
                  const theAddress = await raffleFactory.raffles(0)
                  console.log(theAddress.toString())
                  expect(theAddress).to.not.equal(0);
                  const raffleContract = await ethers.getContractAt("Raffle", theAddress)
                  assert(await (raffleContract.i_minInputMoney()), raffleMinInput)
              })
          })
      })
