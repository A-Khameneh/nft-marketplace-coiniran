const { expect } = require("chai"); 

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

})