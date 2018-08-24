// AuctionFactory.sol
// Enigma, 2018
// Proxy for deploying Auction contracts.

pragma solidity ^0.4.24;

import "./Auction.sol";

contract AuctionFactory {

  /* EVENTS */
  event newAuction(address auction);

  /* STATE VARIABLES */
  address[] public auctions;
  address public enigmaAddress;
  address public enigmaCollectibleAddress;

  /* CONSTRUCTOR */
  constructor(address _enigmaAddress, address _enigmaCollectibleAddress) public {
    require(_enigmaAddress != 0 && enigmaAddress == 0);
    require(_enigmaCollectibleAddress != 0 && enigmaCollectibleAddress == 0);
    enigmaAddress = _enigmaAddress;
    enigmaCollectibleAddress = _enigmaCollectibleAddress;
  }

  /*
   * Creates a new auction.
   * NOTE: _startingPrice must be specified in wei.
   */
  function createAuction(uint _auctionLength, uint _startingPrice) external returns (address) {
    Auction auction = new Auction(msg.sender, _auctionLength, _startingPrice, enigmaAddress, enigmaCollectibleAddress);
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
