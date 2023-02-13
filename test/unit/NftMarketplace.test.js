const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("NFT Marketplace Tests", function () {
          let nftMarketplace, nftMarketplaceContract, basicNft, basicNftContract
          const PRICE = ethers.utils.parseEther("0.1")
          const TOKEN_ID = 0

          beforeEach(async function () {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              user = accounts[1]
              await deployments.fixture(["all"])
              nftMarketplaceContract = await ethers.getContract("NftMarketplace")
              nftMarketplace = nftMarketplaceContract.connect(deployer)
              basicNftContract = await ethers.getContract("BasicNft")
              basicNft = await basicNftContract.connect(deployer)
              await basicNft.mintNft()
              await basicNft.approve(nftMarketplaceContract.address, TOKEN_ID)
          })

          describe("listItem", function () {
              it("emits an event after listing an item", async function () {
                  expect(await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.emit(
                      "ItemListed"
                  )
              })

              it("exclusively lists items that haven't been listed", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const error = `AlreadyListed("${basicNft.address}", ${TOKEN_ID})`
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith(error)
              })

              it("exclusively allows owners to list", async function () {
                  nftMarketplace = nftMarketplaceContract.connect(user)
                  await basicNft.approve(user.address, TOKEN_ID)
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NotOwner")
              })

              it("needs approvals to list item", async function () {
                  await basicNft.approve(ethers.constants.AddressZero, TOKEN_ID)
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NotApprovedForMarketplace")
              })

              it("needs a price greater than zero", async function () {
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, 0)
                  ).to.be.revertedWith("PriceMustBeAboveZero")
              })

              it("updates the listing with seller and price", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                  assert.equal(listing.price.toString(), PRICE.toString())
                  assert.equal(listing.seller.toString(), deployer.address.toString())
              })
          })

          describe("cancelListing", function () {
              it("reverts is there is no listing", async function () {
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith(`NotListed("${basicNft.address}", ${TOKEN_ID})`)
              })

              it("reverts if anyone but the owner tries to call", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  nftMarketplaceUser = nftMarketplaceContract.connect(user)
                  await basicNft.approve(user.address, TOKEN_ID)
                  await expect(
                      nftMarketplaceUser.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NotOwner")
              })

              it("removes the listing when called", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                  assert.equal(listing.price.toString(), 0)
              })

              it("emits an event after cancelling an item", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  expect(await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)).to.emit(
                      "ItemCancelled"
                  )
              })
          })

          describe("buyItem", function () {
              it("reverts if the item isn't listed", async function () {
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NotListed")
              })

              it("reverts if the price is not met", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                          value: ethers.utils.parseEther("0.01"),
                      })
                  ).to.be.revertedWith("PriceNotMet")
              })

              it("transfers the nft to the buyer", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const nftMarketplaceUser = nftMarketplaceContract.connect(user)
                  await nftMarketplaceUser.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                  const newOwner = await basicNft.ownerOf(TOKEN_ID)
                  assert.equal(newOwner.toString(), user.address.toString())
              })

              it("deletes the listing once sold", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const nftMarketplaceUser = nftMarketplaceContract.connect(user)
                  await nftMarketplaceUser.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                  const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                  assert.equal(listing.price.toString(), 0)
              })

              it("updates the internal proceeds record", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const nftMarketplaceUser = nftMarketplaceContract.connect(user)
                  await nftMarketplaceUser.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                  const proceeds = await nftMarketplace.getProceeds(deployer.address)
                  assert.equal(proceeds.toString(), PRICE.toString())
              })

              it("emits an event once an item is bought", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  expect(
                      await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                  ).to.emit("ItemBought")
              })
          })

          describe("updateListing", function () {
              it("reverts if not the owner", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const nftMarketplaceUser = nftMarketplaceContract.connect(user)
                  await expect(
                      nftMarketplaceUser.updateListing(
                          basicNft.address,
                          TOKEN_ID,
                          ethers.utils.parseEther("0.01")
                      )
                  ).to.be.revertedWith("NotOwner")
              })

              it("reverts if it is not listed", async function () {
                  await expect(
                      nftMarketplace.updateListing(
                          basicNft.address,
                          TOKEN_ID,
                          ethers.utils.parseEther("0.01")
                      )
                  ).to.be.revertedWith("NotListed")
              })

              it("updates the price of the item", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const newPrice = ethers.utils.parseEther("0.01")
                  await nftMarketplace.updateListing(basicNft.address, TOKEN_ID, newPrice)
                  const listing = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)
                  assert.equal(newPrice.toString(), listing.price.toString())
              })

              it("emits an event once updated", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const newPrice = ethers.utils.parseEther("0.01")
                  expect(
                      await nftMarketplace.updateListing(basicNft.address, TOKEN_ID, newPrice)
                  ).to.emit("ItemListed")
              })
          })

          describe("withdrawProceeds", function () {
              it("reverts if there are zero proceeds", async function () {
                  await expect(nftMarketplace.withdrawProceeds()).to.be.revertedWith("NoProceeds")
              })

              it("sets the users proceeds back to zero", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const nftMarketplaceUser = nftMarketplaceContract.connect(user)
                  await nftMarketplaceUser.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                  await nftMarketplace.withdrawProceeds()
                  const deployerProceeds = await nftMarketplace.getProceeds(deployer.address)
                  assert.equal(deployerProceeds.toString(), 0)
              })

              it("withdraws the proceeds", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const nftMarketplaceUser = nftMarketplaceContract.connect(user)
                  await nftMarketplaceUser.buyItem(basicNft.address, TOKEN_ID, { value: PRICE })
                  const deployerProceedsBefore = await nftMarketplace.getProceeds(deployer.address)
                  const deployerBalanceBefore = await deployer.getBalance()
                  const txResponse = await nftMarketplace.withdrawProceeds()
                  const txReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const deployerBalanceAfter = await deployer.getBalance()
                  assert.equal(
                      deployerBalanceAfter.add(gasCost).toString(),
                      deployerProceedsBefore.add(deployerBalanceBefore).toString()
                  )
              })
          })
      })
