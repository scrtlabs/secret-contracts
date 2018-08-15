// AuctionFactory.sol, Andrew Tam

pragma solidity ^0.4.24;

import "./Auction.sol";
import "./ActionAuction.sol";

contract AuctionFactory {

  event newAuction(address auction);
  event newActionAuction(address auction);

  address[] public auctions;
  address public enigmaAddress;

  constructor(address _enigmaAddress) public {
    require(_enigmaAddress != 0 && address(enigmaAddress) == 0);
    enigmaAddress = _enigmaAddress;
  }

  function createAuction(uint _auctionLength, uint _startingPrice) external returns (address) {
    Auction auction = new Auction(msg.sender, _auctionLength, _startingPrice, enigmaAddress);
    auctions.push(auction);
    emit newAuction(auction);
  }

  function getAuctionAddresses() public view returns (address[]) {
    return auctions;
  }

}
