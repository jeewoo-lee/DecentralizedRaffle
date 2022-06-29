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
              samplePlayer,
              owner
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
              owner = await raffleContract.i_owner()
              console.log("Owner:", owner)

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
                  assert.equal(
                      (await nftContract.getAmountDepostiedOf(2)).toString(),
                      raffleMinInput.toString()
                  )

                  /**
                   * check if lastVal is updated
                   */
                  assert.equal(
                      (await nftContract.getLastValOf(0)).toString(),
                      tokenData.highVal.toString()
                  )
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

          describe("checkUpkeep", function () {
              it("returns false if people haven't sent any money", async () => {
                  await network.provider.send("evm_increaseTime", [INTERVAL + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await raffleContract.callStatic.checkUpkeep("0x")
                  assert(!upkeepNeeded)
              })

              it("returns false if raffle isn't open", async () => {
                  await raffleContract.enterRaffle({ value: raffleMinInput })
                  await network.provider.send("evm_increaseTime", [INTERVAL + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  await raffleContract.performUpkeep([])
                  const raffleState = await raffleContract.s_raffleState()
                  const { upkeepNeeded } = await raffleContract.callStatic.checkUpkeep("0x")
                  assert.equal(raffleState.isOpen == false, upkeepNeeded == false)
              })

              it("returns false if enough time hasn't passed", async () => {
                  await raffleContract.enterRaffle({ value: raffleMinInput })
                  await network.provider.send("evm_increaseTime", [INTERVAL - 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await raffleContract.callStatic.checkUpkeep("0x")
                  assert(!upkeepNeeded)
              })

              it("returns true if enough time has passed, has players, eth, and is open", async () => {
                  await raffleContract.enterRaffle({ value: raffleMinInput })
                  await network.provider.send("evm_increaseTime", [INTERVAL + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const { upkeepNeeded } = await raffleContract.callStatic.checkUpkeep("0x")
                  const txResponse = await raffleContract.checkUpkeep("0x")
                  assert(upkeepNeeded)
                  const txReceipt = await txResponse.wait(1)
                  //   console.log(txReceipt.events);
              })
          })

          describe("performUpkeep", function () {
              it("can only run if checkupkeep is true", async () => {
                  await raffleContract.enterRaffle({ value: raffleMinInput })
                  await network.provider.send("evm_increaseTime", [INTERVAL + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const tx = await raffleContract.performUpkeep("0x")
                  assert(tx)
              })

              it("reverts if checkup is false", async () => {
                  await expect(raffleContract.performUpkeep("0x")).to.be.revertedWith(
                      "Raffle__UpkeepNotNeeded"
                  )
              })

              it("updates the raffle state and emits a requestId", async () => {
                  console.log((await accounts[1].getBalance()).toString())
                  console.log((await accounts[0].getBalance()).toString())
                  await raffleContract.connect(accounts[1]).enterRaffle({ value: ITEM_PRICE })
                  await raffleContract.enterRaffle({ value: ITEM_PRICE })
                  await network.provider.send("evm_increaseTime", [INTERVAL + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const txResponse = await raffleContract.performUpkeep("0x")
                  const txReceipt = await txResponse.wait(1)
                  const raffleState = await raffleContract.s_raffleState()
                  assert(raffleState.isOpen == false)
                  console.log(txReceipt.events)
                  const requestId = txReceipt.events[1].args.requestId
                  assert(requestId.toNumber() > 0)
                  console.log("RequestId:", requestId.toNumber())
              })

              it("emits inadequate funding when a funding goal is not reached", async () => {
                  await raffleContract.enterRaffle({ value: raffleMinInput })
                  await network.provider.send("evm_increaseTime", [INTERVAL + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  const txResponse = await raffleContract.performUpkeep("0x")
                  const txReceipt = await txResponse.wait(1)
                  const withdraw = await raffleContract.s_canUserWithdraw()
                  assert(withdraw == true)
                  console.log(txReceipt.events)
                  const msg = txReceipt.events[0].args.msg
                  assert(msg.toString() == ":(")
              })
          })

          describe("fulfillRandomWords", function () {
              beforeEach(async () => {
                  await raffleContract.enterRaffle({ value: raffleMinInput })
                  let raffle = raffleContract.connect(accounts[2])
                  await raffle.enterRaffle({ value: ITEM_PRICE })
                  await network.provider.send("evm_increaseTime", [INTERVAL + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })
                  console.log((await nftContract.getLastValOf(0)).toString())
              })
              it("can only be called after performUpkeep", async () => {
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(0, raffleContract.address)
                  ).to.be.revertedWith("nonexistent request")
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(1, raffleContract.address)
                  ).to.be.revertedWith("nonexistent request")
              })
              it("can check win", async () => {
                  assert.equal(await raffleContract.checkWin(2), false)
                  console.log("------------------------")
                  await raffleContract.connect(accounts[1]).enterRaffle({ value: ITEM_PRICE })
                  await network.provider.send("evm_increaseTime", [INTERVAL + 1])
                  await network.provider.request({ method: "evm_mine", params: [] })

                  const txResponse = await raffleContract.performUpkeep("0x")
                  const txReceipt = await txResponse.wait(1)
                  const requestId = txReceipt.events[1].args.requestId

                  console.log((await accounts[0].getBalance()).toString())
                  await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, raffleContract.address)
                  console.log("Win Num:", (await raffleContract.s_winNum()).toString())
                  console.log((await accounts[0].getBalance()).toString())

                  console.log("Tokens:", (await nftContract.s_tokenId()).toString())

                  assert.equal(await raffleContract.checkWin(3), true)
              })

              it("picks the winning number", async () => {
                  await new Promise(async (resolve, reject) => {
                      console.log("fsfsddsfssdsf")
                      raffleContract.once("WinnerPicked", async () => {
                          console.log("Winner Picked!")
                          try {
                              const winNum = await raffleContract.s_winNum()
                              console.log(winNum.toString())
                              assert(winNum.toNumber() != 0)
                              resolve()
                          } catch (e) {
                              reject(e)
                          }
                      })
                      const txResponse = await raffleContract.performUpkeep("0x")
                      const txReceipt = await txResponse.wait(1)
                      const requestId = txReceipt.events[1].args.requestId
                      await vrfCoordinatorV2Mock.fulfillRandomWords(
                          requestId,
                          raffleContract.address
                      )
                  })
              })
          })
      })
