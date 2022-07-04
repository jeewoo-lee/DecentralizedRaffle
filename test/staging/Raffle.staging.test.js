const { assert, expect } = require("chai")
const { getNamedAccounts, network, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")
const { sqrt } = require("../../utils/math")
const { readFile } = require("../../utils/fs")

const ITEM_PRICE = ethers.utils.parseEther("0.005")
const entranceFee = networkConfig[network.config.chainId]["entranceFee"]
const feeStuff = networkConfig[network.config.chainId]["fee"]

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Staging Test", function () {
          let raffleFactory, raffleMinInput, deployer, raffleContract, nftContract, owner
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              const factoryAddress = readFile(
                  "/Users/leejeewoo/Elysia/Raffle/miscellaneous/.raffleFactoryAddress"
              )
              raffleFactory = await ethers.getContractAt("RaffleFactory", factoryAddress)

              const vrfCoordinatorV2Address = networkConfig[network.config.chainId].vrfCoordinatorV2

              /**
               * NFT Contract
               */
              const nftAddress = await raffleFactory.nftAddress()
              nftContract = await ethers.getContractAt("NFT", nftAddress)

              /**
               * raffle contract for testing purposes later on.
               */
              const theAddress = readFile(
                  "/Users/leejeewoo/Elysia/Raffle/miscellaneous/.testRaffleAddress"
              )

              console.log(theAddress)
              raffleContract = await ethers.getContractAt("Raffle", theAddress)
              await raffleContract.startRaffle()

              // await raffleFactory.createRaffle(ITEM_PRICE, INTERVAL)
              // const theAddress = await raffleFactory.raffles(0)
              // raffleContract = await ethers.getContractAt("Raffle", theAddress)
              // owner = await raffleContract.i_owner()
              // console.log("Owner:", owner.toString())
              // console.log("Raffle Address:", theAddress.toString())
              // const accounts = await ethers.getSigners()
          })

          describe("user experience", function () {
              it("successfully gets winner after the user enters", async () => {
                  console.log("Starting the test ...")
                  await new Promise(async (resolve, reject) => {
                      raffleContract.once("WinnerPicked", async () => {
                          console.log("Winner Picked!")
                          try {
                              const winNum = await raffleContract.s_winNum()
                              const raffleState = await raffleContract.s_raffleState()
                              console.log(winNum.toString())
                              assert(winNum.toString() != "0")
                              assert(raffleState.isOpen == false)
                              console.log((await accounts[0].getBalance()).toString())
                              console.log(
                                  await raffleContract.checkWin(1),
                                  await raffleContract.checkWin(2)
                              )

                              resolve()
                          } catch (e) {
                              reject(e)
                          }
                      })
                      console.log("Entering Raffle...")
                      const tx = await raffleContract.enterRaffle({ value: entranceFee })
                      console.log("here?");
                      await raffleContract.enterRaffle({ value: entranceFee })
                      await raffleContract.enterRaffle({ value: feeStuff })
                    //   await raffleContract.enterRaffle({ value: ITEM_PRICE })
                      console.log("fdssdf");
                      await tx.wait(1)
                      console.log("Ok, time to wait...")
                      console.log((await accounts[0].getBalance()).toString())
                  })
              })
          })
      })
