// AuctionFactory.sol, Andrew Tam

pragma solidity ^0.4.24;

import "./Auction.sol";
import "./ActionAuction.sol";

contract AuctionFactory {

  event newAuction(address auction);
  event newActionAuction(address auction);

  address[] public auctions;
  address public enigmaAddress;

  // action auctions
  address[] public actionAuctions;

  constructor(address _enigmaAddress) public {
    require(_enigmaAddress != 0 && address(enigmaAddress) == 0);
    enigmaAddress = _enigmaAddress;
  }

  function createAuction(uint _auctionLength) external returns (address) {
    Auction auction = new Auction(msg.sender, _auctionLength, enigmaAddress);
    auctions.push(auction);
    emit newAuction(auction);
  }

  function createActionAuction(address _charity, uint _auctionLength) external returns (address) {
    ActionAuction auction = new ActionAuction(msg.sender, _charity, _auctionLength, enigmaAddress);
    actionAuctions.push(auction);
    emit newActionAuction(auction);
  }

  function getAuctionAddresses() public view returns (address[]) {
    return auctions;
  }

  function getActionAuctionAddresses() public view returns (address[]) {
    return actionAuctions;
  }

}
