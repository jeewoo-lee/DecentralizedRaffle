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
              console.log("Owner:", owner.toString())
              console.log("Raffle Address:", theAddress.toString())
              const accounts = await ethers.getSigners()
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
                              assert(winNum.toNumber() != 0)
                              assert(raffleState.isOpen == false)
                              console.log((await accounts[0].getBalance()).toString())
                              resolve()
                          } catch (e) {
                              reject(e)
                          }
                          console.log("Entering Raffle...")
                          const tx = await raffleContract.enterRaffle({ value: raffleEntranceFee })
                          await tx.wait(1)
                          console.log("Ok, time to wait...")
                          console.log((await accounts[0].getBalance()).toString())
                      })
                  })
              })
          })
      })
