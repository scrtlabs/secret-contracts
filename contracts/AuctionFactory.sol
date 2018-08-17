// AuctionFactory.sol, Andrew Tam

pragma solidity ^0.4.24;

import "./Auction.sol";
import "./ActionAuction.sol";

contract AuctionFactory {

  /* EVENTS */
  event newAuction(address auction);
  event newActionAuction(address auction);

  /* STATE VARIABLES */
  address[] public auctions;
  address public enigmaAddress;

  /* CONSTRUCTOR */
  constructor(address _enigmaAddress) public {
    require(_enigmaAddress != 0 && address(enigmaAddress) == 0);
    enigmaAddress = _enigmaAddress;
  }

  /*
   * Creates a new auction.
   * NOTE: _startingPrice must be specified in wei.
   */
  function createAuction(uint _auctionLength, uint _startingPrice) external returns (address) {
    Auction auction = new Auction(msg.sender, _auctionLength, _startingPrice, enigmaAddress);
    auctions.push(auction);
    emit newAuction(auction);
  }

  /*
   * Get every auction address created.
   */
  function getAuctionAddresses() public view returns (address[]) {
    return auctions;
  }

}
