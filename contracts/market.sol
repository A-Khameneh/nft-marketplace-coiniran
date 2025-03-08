// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "hardhat/console.sol";

contract Market {

    // Variables
    address payable public immutable feeAccount; // the account that receives fees
    uint public immutable feePercent; // the fee percentage on sales 
    uint public itemCount; 

    enum ItemStatus {
        Available,
        Sold,
        Canceled
    }

    struct Item {
        uint itemId;
        IERC721 nft;
        uint tokenId;
        uint price;
        address payable seller;
        ItemStatus status;
    }

    // itemId -> Item
    mapping(uint => Item) public items;

    event Offered(
        uint itemId,
        address indexed nft,
        uint tokenId,
        uint price,
        address indexed seller
    );

    event Bought(
        uint itemId,
        address indexed nft,
        uint tokenId,
        uint price,
        address indexed seller,
        address indexed buyer
    );

    event Canceled(

        uint itemId, 
        address indexed nft, 
        uint tokenId, 
        address indexed seller

    );

    constructor(uint _feePercent) {
        feeAccount = payable(msg.sender);
        feePercent = _feePercent;
    }

    // Make item to offer on the marketplace
    function makeItem(IERC721 _nft, uint _tokenId, uint _price) external {

        require(_price > 0, "Price must be greater than zero");

        // increment itemCount
        itemCount ++;

        // transfer nft
        _nft.transferFrom(msg.sender, address(this), _tokenId);

        // add new item to items mapping
        items[itemCount] = Item (
            itemCount,
            _nft,
            _tokenId,
            _price,
            payable(msg.sender),
            ItemStatus.Available
        );

        // emit Offered event
        emit Offered(
            itemCount,
            address(_nft),
            _tokenId,
            _price,
            msg.sender
        );
    }

    function purchaseItem(uint _itemId) external payable {

        uint _totalPrice = getTotalPrice(_itemId);
        Item storage item = items[_itemId];
        
        require(_itemId > 0 && _itemId <= itemCount, "item doesn't exist");
        require(msg.value >= _totalPrice, "not enough ether to cover item price and market fee");
        require(item.status == ItemStatus.Available, "Item not available");
        // pay seller and feeAccount
        item.seller.transfer(item.price);
        feeAccount.transfer(_totalPrice - item.price);
        // update item to sold
        item.status = ItemStatus.Sold;
        // transfer nft to buyer
        item.nft.transferFrom(address(this), msg.sender, item.tokenId);
        // emit Bought event
        emit Bought(
            _itemId,
            address(item.nft),
            item.tokenId,
            item.price,
            item.seller,
            msg.sender
        );
    }

    function cancelItem(uint _itemId) external {

        Item storage item = items[_itemId];
    
        require(_itemId > 0 && _itemId <= itemCount, "Item doesn't exist");
        require(msg.sender == item.seller, "Only seller can cancel");
        require(item.status == ItemStatus.Available, "Item not available");

        item.status = ItemStatus.Canceled;

        //return nft to seller address
        item.nft.transferFrom(address(this), item.seller, item.tokenId);

        emit Canceled(_itemId, address(item.nft), item.tokenId, item.seller);

    }

    function getTotalPrice(uint _itemId) view public returns(uint){
        return((items[_itemId].price*(100 + feePercent))/100);
    }

}