// Auction.sol, Andrew Tam
// Need to add claimReward function

pragma solidity ^0.4.24;

import "./Enigma.sol";

contract ActionAuction {

  enum AuctionState { IN_PROGRESS, CALCULATING, COMPLETED }

  struct Bidder {
    bool hasBidded;
    bytes bidValue;
  }

  address public owner;
  uint public startTime;
  uint public endTime;
  address public winner;
  address public charity;
  mapping(address => Bidder) public bidders;
  address[] public bidderAddresses;
  Enigma public enigma;
  AuctionState public state;

  event Bid(address bidder);
  event Winner(address winner, uint bidValue);

  constructor(address _owner, address _charity, uint _auctionLength, address _enigma) public {
    owner = _owner;
    charity = _charity;
    startTime = now;
    endTime = startTime + _auctionLength * 1 seconds;
    enigma = Enigma(_enigma);
    state = AuctionState.IN_PROGRESS;  // redundant
  }

  function bid(bytes _bidValue) external {
    require(!hasBidded(msg.sender), "User has bidded already.");
    require(now < endTime);
    bidders[msg.sender].bidValue = _bidValue;
    bidders[msg.sender].hasBidded = true;
    emit Bid(msg.sender);
  }

  function endAuction() external {
    require(msg.sender == owner);
    require(state == AuctionState.IN_PROGRESS);
    //require(now >= endTime);
    state = AuctionState.CALCULATING;
  }

  //callable
  // in the event of a tie, we're just taking the first bidder
  function getHighestBidder(address[] _bidders, uint[] _bidAmounts) public pure returns (address, uint) {
    address highestBidder;
    uint highestBidAmount;
    for (uint i = 0; i < _bidders.length; i++) {
      if (_bidAmounts[i] > highestBidAmount) {
        highestBidAmount = _bidAmounts[i];
        highestBidder = _bidders[i];
      }
    }
    return (highestBidder, highestBidAmount);
  }

  // callback
  function updateWinner(address _highestBidder, uint _highestBidAmount) public
    //onlyEnigma() comment this out for testing
    {
    winner = _highestBidder;
    state = AuctionState.COMPLETED;
    emit Winner(_highestBidder, _highestBidAmount);
  }

  /*
   * Modifier that checks that the contract caller is the Enigma contract.
   */
  modifier onlyEnigma() {
    require(msg.sender == address(enigma));
    _;
  }

  function hasBidded(address _bidder) public view returns (bool) {
    return bidders[_bidder].hasBidded;
  }

  function getAllBidders() public view returns (address[]) {
    return bidderAddresses;
  }

  function getExpirationTime() public view returns (uint) {
    return endTime;
  }

  function getAuctionState() public view returns (AuctionState) {
    return state;
  }

  function getBidValueForBidder(address _bidder) public view returns (bytes) {
    require(hasBidded(_bidder), "User has not bidded yet.");
    return bidders[_bidder].bidValue;
  }

  function getWinner() public view returns(address) {
    require(state == AuctionState.COMPLETED);
    return winner;
  }

}
