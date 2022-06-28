const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { sqrt } = require("../../utils/math")

const ITEM_PRICE = ethers.utils.parseEther("1")
const INTERVAL = 120

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", function () {
          let raffleFactory,
              raffleFactoryContract,
              vrfCoordinatorV2Mock,
              raffleMinInput,
              deployer,
              raffleContract,
              nftContract,
              samplePlayer
          beforeEach(async () => {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              samplePlayer = accounts[1]
              await deployments.fixture(["mocks", "raffle"])
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
              raffleFactoryContract = await ethers.getContract("RaffleFactory")
              raffleFactory = raffleFactoryContract.connect(deployer)
              raffleMinInput = await raffleFactory.minInput()
              console.log("Deployer: ", deployer.address.toString())

              /**
               * create raffle contract for testing purposes later on.
               */
              await raffleFactory.createRaffle(ITEM_PRICE, INTERVAL)
              const theAddress = await raffleFactory.raffles(0)
              raffleContract = await ethers.getContractAt("Raffle", theAddress)

              /**
               * NFT contract created when raffleFactory is initialized.
               */
              const nftAddress = await raffleFactory.nftAddress()
              nftContract = await ethers.getContractAt("NFT", nftAddress)
          })

          describe("constructor", function () {
              it("correctly initialized", async () => {
                  console.log((await raffleFactory.minInput()).toString())
                  assert.equal(
                      networkConfig[network.config.chainId]["fee"].toString(),
                      raffleMinInput.toString()
                  )
              })
              it("creates nft contract", async () => {
                  const nftAddress = await raffleFactory.nftAddress()
                  console.log("NFT:", nftAddress.toString())
                  expect(nftAddress).to.not.equal(0)
              })
          })

          describe("createRaffle", function () {
              it("correctly deploys raffle contract", async () => {
                  console.log((await raffleFactory.owner()).toString())
                  await raffleFactory.createRaffle(ITEM_PRICE, INTERVAL)
                  const theAddress = await raffleFactory.raffles(1)
                  console.log(theAddress.toString())
                  expect(theAddress).to.not.equal(0)
                  const raffleContract = await ethers.getContractAt("Raffle", theAddress)
                  assert.equal(
                      (await raffleContract.i_minInputMoney()).toString(),
                      raffleMinInput.toString()
                  )
                  const raffleState = await raffleContract.s_raffleState()
                  assert.equal(raffleState.raffleId.toString(), "1")
              })
          })

          describe("raffle states", function () {
              it("correctly initalizes raffle states", async () => {
                  const raffleState = await raffleContract.s_raffleState()
                  assert.equal(raffleState.isOpen, true)
                  assert.equal(raffleState.interval, INTERVAL)
                  assert.equal(raffleState.raffleId, 0)
              })
          })

          describe("NFT", function () {
              it("reverts when you don't pay enough", async () => {
                  await expect(raffleContract.enterRaffle()).to.be.revertedWith(
                      "Raffle__NotEnoughMoney"
                  )
              })

              it("correctly mints nft and getter functions work", async () => {
                  await raffleContract.enterRaffle({ value: raffleMinInput })
                  let total_deposited = await raffleContract.s_total_deposited()
                  assert.equal(total_deposited.toString(), raffleMinInput.toString())
                  let deposit = await nftContract.getAmountDepostiedOf(1)
                  assert.equal(deposit.toString(), raffleMinInput.toString())
                  let tokenData = await nftContract.getTokenDataOf(1)
                  assert.equal(tokenData.lowVal.toString(), "0")
                  assert.equal(tokenData.highVal.toString(), Math.round(sqrt(deposit)).toString())
                  console.log(tokenData.highVal.toString(), Math.round(sqrt(deposit)).toString())

                  /**
                   * one more token
                   */

                  await raffleContract.enterRaffle({ value: raffleMinInput })
                  total_deposited = await raffleContract.s_total_deposited()
                  //   assert.equal(total_deposited.toString(), (deposit + raffleMinInput).toString())
                  deposit = await nftContract.getAmountDepostiedOf(2)
                  assert.equal(deposit.toString(), raffleMinInput.toString())
                  tokenData = await nftContract.getTokenDataOf(2)
                  assert.equal(tokenData.lowVal.toString(), Math.round(sqrt(deposit)).toString())
                  assert.equal(
                      tokenData.highVal.toString(),
                      Math.round(2 * sqrt(deposit)).toString()
                  )

                  /**
                   * check if lastVal is updated
                   */
                  assert.equal((await nftContract.getLastValOf(0)).toString(), tokenData.highVal.toString())
              })

              it("reverts with an invalid token id", async () => {
                  await expect(nftContract.getAmountDepostiedOf(2442332)).to.be.revertedWith(
                      "NFT__InvalidTokenId"
                  )
              })

              it("reverts when mint isn't called by raffle address", async () => {
                  await expect(nftContract.mint(0, samplePlayer.address, 0, 0)).to.be.revertedWith(
                      "NFT__InvalidRaffleAddress"
                  )
              })
          })
      })
