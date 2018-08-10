// AuctionFactory.sol, Andrew Tam

pragma solidity ^0.4.24;

import "./Auction.sol";

contract AuctionFactory {

  event newAuction(address auction);

  address[] public auctions;
  address public enigmaAddress;

  constructor(address _enigmaAddress) public {
    require(_enigmaAddress != 0 && address(enigmaAddress) == 0);
    enigmaAddress = _enigmaAddress;
  }

  function createAuction(uint _auctionLength) external {
    Auction auction = new Auction(msg.sender, _auctionLength, enigmaAddress);
    auctions.push(auction);
    emit newAuction(auction);
  }

  function getAuctionAddresses() public view returns (address[]) {
    return auctions;
  }

}
