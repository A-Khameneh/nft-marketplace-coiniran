import { useState } from 'react'
import { ethers } from "ethers"
import { Row, Form, Button } from 'react-bootstrap'
import { create as ipfsHttpClient } from 'ipfs-http-client'
const fs = require('fs')

const Create = ({ market, nft }) => {

  let data = new FormData()

  const [image, setImage] = useState('')
  const [price, setPrice] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const uploadToIPFS = async (event) => {
    
    if (typeof file !== 'undefined') {

      try {

        const result = data.append('file', fs.createReadStream(event.target.files[0]))
        data.append('pinataMetadata', '{"name": event.target.files[0]}')
        console.log(result)

      } catch (error){

        console.log("ipfs image upload error: ", error)

      }
    }
  }

  const createNFT = async () => {

    if (!image || !price || !name || !description) return

    try{

      const result = 0;
      data.append('pinataMetadata', '{"name": "pinnie"}')
      mintThenList(result)

    } catch(error) {

      console.log("ipfs uri upload error: ", error)

    }

  }
  const mintThenList = async (result) => {

    const uri = `https://ipfs.infura.io/ipfs/${result.path}`
    // mint nft 
    await(await nft.mint(uri)).wait()
    // get tokenId of new nft 
    const id = await nft.tokenCount()
    // approve marketplace to spend nft
    await(await nft.setApprovalForAll(market.address, true)).wait()
    // add nft to marketplace
    const listingPrice = ethers.utils.parseEther(price.toString())
    await(await market.makeItem(nft.address, id, listingPrice)).wait()

  }

  return (
    <div className="container-fluid mt-5">
      <div className="row">
        <main role="main" className="col-lg-12 mx-auto" style={{ maxWidth: '1000px' }}>
          <div className="content mx-auto">
            <Row className="g-4">
              <Form.Control
                type="file"
                required
                name="file"
                onChange={uploadToIPFS}
              />
              <Form.Control onChange={(e) => setName(e.target.value)} size="lg" required type="text" placeholder="Name" />
              <Form.Control onChange={(e) => setDescription(e.target.value)} size="lg" required as="textarea" placeholder="Description" />
              <Form.Control onChange={(e) => setPrice(e.target.value)} size="lg" required type="number" placeholder="Price in ETH" />
              <div className="d-grid px-0">
                <Button onClick={createNFT} variant="primary" size="lg">
                  Create & List NFT!
                </Button>
              </div>
            </Row>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Create