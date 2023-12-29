 import React from 'react';

 import {
   BrowserRouter,
   Routes,
   Route
 } from "react-router-dom";
 import Navigation from './Navbar';
 import Home from './Home.js'
 import Create from './Create.js'
 import MyListedItems from './MyListedItems.js'
 import MyPurchases from './MyPurchases.js'
 import MarketAbi from './contracts/Market.json'
 import MarketAddress from './contracts/Market-address.json'
 import NFTAbi from './contracts/NFT.json'
 import NFTAddress from './contracts/NFT-address.json'
 import { useState } from 'react'
 import { ethers } from "ethers"
 import { Spinner } from 'react-bootstrap'


function App() {

  const [loading, setLoading] = useState(true);
  const [nft, setNFT] = useState({});
  const [market, setMarket] = useState({});
  const [account, setAccount] = useState(null)

  async function reqAccount() {

    if ( window.ethereum ) {
      console.log("Metamask detected...")

      try {
        
        const accounts = await window.ethereum.request({ 

          method: "eth_requestAccounts",

         });

          setAccount(accounts[0]);

           const provider = new ethers.providers.Web3Provider(window.ethereum)
           
           console.log(provider)
           // Set signer
           const signer = provider.getSigner()

           loadContracts(signer)
     
          window.ethereum.on('chainChanged', (chainId) => {
            window.location.reload();
          })
     
          window.ethereum.on('accountsChanged', async function (accounts) {

           setAccount(accounts[0])
           await reqAccount()

         })


      } catch (error) {
        console.log("something went wrong!");
      }

    } else {
      console.log("Metamask not detected!")
    }

  }

  const loadContracts = (signer) => {

    // Get deployed copies of contracts
    setMarket(new ethers.Contract(MarketAddress.address, MarketAbi, signer))
    setNFT(new ethers.Contract(NFTAddress.address, NFTAbi, signer))
    setLoading(false)

  }
  
  return (

    <BrowserRouter>

      <div className="App">
        <>
          <Navigation reqAccount={reqAccount} account={account} />
        </>
        <div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
              <Spinner animation="border" style={{ display: 'flex' }} />
              <p className='mx-3 my-0'>Awaiting Metamask Connection...</p>
            </div>
          ) : (
            <Routes>
              <Route path="/" element={
                <Home market={market} nft={nft} />
              } />
              <Route path="/create" element={
                <Create market={market} nft={nft} />
              } />
              <Route path="/my-listed-items" element={
                <MyListedItems market={market} nft={nft} account={account} />
              } />
              <Route path="/my-purchases" element={
                <MyPurchases market={market} nft={nft} account={account} />
              } />
            </Routes>
          )}
        </div>
      </div>
    
    </BrowserRouter>

  );

}

export default App;