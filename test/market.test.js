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

  })

})