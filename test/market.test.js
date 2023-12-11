const { expect } = require("chai"); 
const { ethers } = require("hardhat");

const toWei = (num) => ethers.parseEther(num.toString())

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

})