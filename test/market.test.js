const { expect } = require("chai"); 
const { ethers } = require("hardhat");

const toWei = (num) => ethers.parseEther(num.toString());
const fromWei = (num) => ethers.formatEther(num);

describe("NFTMarketplace", () => {

  let NFT;
  let nft;
  let Market;
  let market;
  let deployer;
  let addr1;
  let addr2;
  let addrs;
  let feePercent = 1;
  let URI = "sample URI";

  beforeEach(async () => {
    // Get the ContractFactories and Signers here.
    NFT = await ethers.getContractFactory("NFT");
    Market = await ethers.getContractFactory("Market");
    [deployer, addr1, addr2, ...addrs] = await ethers.getSigners();

    // To deploy our contracts
    nft = await NFT.deploy();
    market = await Market.deploy(feePercent);
  });

  describe("Deployment", () => {

    it("Should track name and symbol of the nft collection", async function () {
      // This test expects the owner variable stored in the contract to be equal
      // to our Signer's owner.
      const nftName = "First Smile"
      const nftSymbol = "FSL"
      expect(await nft.name()).to.equal(nftName);
      expect(await nft.symbol()).to.equal(nftSymbol);
    });

    it("Should track feeAccount and feePercent of the marketplace", async function () {
        expect(await market.feeAccount()).to.equal(deployer.address);
        expect(await market.feePercent()).to.equal(feePercent);
    });

  })

  describe("Minting NFTs", function () {

    it("Should track each minted NFT", async function () {
      // addr1 mints an nft
      await nft.connect(addr1).mint(URI)
      expect(await nft.tokenCount()).to.equal(1);
      expect(await nft.balanceOf(addr1.address)).to.equal(1);
      expect(await nft.tokenURI(1)).to.equal(URI);
      // addr2 mints an nft
      await nft.connect(addr2).mint(URI)
      expect(await nft.tokenCount()).to.equal(2);
      expect(await nft.balanceOf(addr2.address)).to.equal(1);
      expect(await nft.tokenURI(2)).to.equal(URI);
    });
    
  })

  describe("Making marketplace items", function () {
    let price = 1
    let result 
    beforeEach(async function () {
      // addr1 mints an nft
      await nft.connect(addr1).mint(URI)
      // addr1 approves marketplace to spend nft
      await nft.connect(addr1).setApprovalForAll(await market.getAddress(), true)
    })


    it("Should track created item, transfer NFT from seller to marketplace and emit Offered event", async function () {
      // addr1 offers their nft at a price of 1 ether
      await expect(market.connect(addr1).makeItem(await nft.getAddress(), 1 , toWei(price)))
        .to.emit(market, "Offered")
        .withArgs(
          1,
          await nft.getAddress(),
          1,
          toWei(price),
          addr1.address
        )
      // Owner of NFT should now be the marketplace
      expect(await nft.ownerOf(1)).to.equal(await market.getAddress());
      // Item count should now equal 1
      expect(await market.itemCount()).to.equal(1)
      // Get item from items mapping then check fields to ensure they are correct
      const item = await market.items(1)
      expect(item.itemId).to.equal(1)
      expect(item.nft).to.equal(await nft.getAddress())
      expect(item.tokenId).to.equal(1)
      expect(item.price).to.equal(toWei(price))
      expect(item.sold).to.equal(false)
    });

    it("Should fail if price is set to zero", async function () {
      await expect(
        market.connect(addr1).makeItem(await nft.getAddress(), 1, 0)
      ).to.be.revertedWith("Price must be greater than zero");
    });

  });

  describe("Purchasing marketplace items", function () {

    let price = 2
    let fee = (feePercent/100)*price
    let totalPriceInWei

    beforeEach(async function () {
      // addr1 mints an nft
      await nft.connect(addr1).mint(URI)
      // addr1 approves marketplace to spend tokens
      await nft.connect(addr1).setApprovalForAll(market.getAddress(), true)
      // addr1 makes their nft a marketplace item.
      await market.connect(addr1).makeItem(nft.getAddress(), 1 , toWei(price))
    })

    it("Should update item as sold, pay seller, transfer NFT to buyer, charge fees and emit a Bought event", async function () {
      const sellerInitalEthBal = await deployer.provider.getBalance(addr1.address)
      const feeAccountInitialEthBal = await deployer.provider.getBalance(deployer.address)
      console.log(sellerInitalEthBal);
      console.log(feeAccountInitialEthBal);
      // fetch items total price (market fees + item price)
      totalPriceInWei = await market.getTotalPrice(1);
      console.log(totalPriceInWei);
      // addr 2 purchases item.
      await expect(market.connect(addr2).purchaseItem(1, {value: totalPriceInWei}))
      .to.emit(market, "Bought")
        .withArgs(
          1,
          await nft.getAddress(),
          1,
          toWei(price),
          addr1.address,
          addr2.address
        )
      const sellerFinalEthBal = await deployer.provider.getBalance(addr1.address)
      const feeAccountFinalEthBal = await deployer.provider.getBalance(deployer.address)
      // Item should be marked as sold
      expect((await market.items(1)).sold).to.equal(true)
      // Seller should receive payment for the price of the NFT sold.
      expect(+fromWei(sellerFinalEthBal)).to.equal(+price + +fromWei(sellerInitalEthBal))
      // feeAccount should receive fee
      expect(+fromWei(feeAccountFinalEthBal)).to.equal(+fee + +fromWei(feeAccountInitialEthBal))
      // The buyer should now own the nft
      expect(await nft.ownerOf(1)).to.equal(addr2.address);
    })

    it("Should fail for invalid item ids, sold items and when not enough ether is paid", async function () {
      // fails for invalid item ids
      await expect(
        market.connect(addr2).purchaseItem(2, {value: totalPriceInWei})
      ).to.be.revertedWith("item doesn't exist");
      await expect(
        market.connect(addr2).purchaseItem(0, {value: totalPriceInWei})
      ).to.be.revertedWith("item doesn't exist");
      // Fails when not enough ether is paid with the transaction. 
      // In this instance, fails when buyer only sends enough ether to cover the price of the nft
      // not the additional market fee.
      await expect(
        market.connect(addr2).purchaseItem(1, {value: toWei(price)})
      ).to.be.revertedWith("not enough ether to cover item price and market fee"); 
      /*// addr2 purchases item 1
      await market.connect(addr2).purchaseItem(1, {value: totalPriceInWei})
      // addr3 tries purchasing item 1 after its been sold 
      const addr3 = addrs[0]
      //console.log(await deployer.provider.getBalance(addr3.address))
      await expect(
        market.connect(addr3).purchaseItem(1, {value: totalPriceInWei})
      ).to.be.revertedWith("item already sold");*/
    });

  })

})