// Auction.sol, Andrew Tam
// Need to finish claimReward function

pragma solidity ^0.4.24;

import "./Enigma.sol";

contract Auction {

  /* Determine the state of the auction. */
  enum AuctionState { IN_PROGRESS, CALCULATING, COMPLETED }

  /* EVENTS */
  event Bid(address bidder);
  event Winner(address winner, uint bidValue);

  /* BIDDER */
  struct Bidder {
    bool hasBidded;
    bytes bidValue;
  }

  /* STATE VARIABLES */
  address public owner;
  uint public startTime;
  uint public endTime;
  address public winner;
  uint public startingPrice;
  uint public winningPrice;
  mapping(address => Bidder) public bidders;
  address[] public bidderAddresses;
  Enigma public enigma;
  AuctionState public state;

  // testing
  mapping(address => uint) stakeAmounts;

  /* CONSTRUCTOR */
  constructor(address _owner, uint _auctionLength, uint _startingPrice, address _enigma) public {
    owner = _owner;
    startingPrice = _startingPrice;
    startTime = now;
    endTime = startTime + _auctionLength * 1 seconds;
    enigma = Enigma(_enigma);
    state = AuctionState.IN_PROGRESS;  // redundant
  }

  /*
   * Stake Ether in the contract to create a binding commitment. You can increase stake anytime within the bidding period.
   */
  function stake() payable external {
    require(state == AuctionState.IN_PROGRESS);
    stakeAmounts[msg.sender] += msg.value;
  }

  /*
   * Withdraw Ether after the bidding period has ended.
   */
  function withdraw(uint _amount) external {
    require(state == AuctionState.COMPLETED);
    if (msg.sender == winner) {
      require(_amount <= stakeAmounts[msg.sender] - winningPrice);
    }
    else {
      require(_amount <= stakeAmounts[msg.sender]);
    }
    msg.sender.transfer(_amount);
  }

  /*
   * Bid in the auction. The value of the bid is encrypted and is denoted in wei.
   * NOTE: A user can bid multiple times as long as it's within the bidding period.
   */
  function bid(bytes _bidValue) external {
    require(now < endTime);  // a user can only bid within the time period
    require(stakeAmounts[msg.sender] >= startingPrice);  // a user can only bid if they have enough stake to fill the initial starting value
    bidders[msg.sender].bidValue = _bidValue;
    if (!(bidders[msg.sender].hasBidded)) {
      bidders[msg.sender].hasBidded = true;
    }
    emit Bid(msg.sender);
  }

  /*
   * End the auction. Only the creator of the auction can end the auction(when the bidding period has expired).
   */
  function endAuction() external {
    require(msg.sender == owner);
    require(state == AuctionState.IN_PROGRESS);
    //require(now >= endTime);
    state = AuctionState.CALCULATING;
  }

  /*
   * The callable function. Gets the highest bidder and bid amount for the auction.
   * NOTE: In the event of a tie, we're just taking the first bidder.
   */
  function getHighestBidder(address[] _bidders, uint[] _bidAmounts, uint[] _stakeAmounts) public pure returns (address, uint) {
    address highestBidder;
    uint highestBidAmount;
    for (uint i = 0; i < _bidders.length; i++) {
      if ((_bidAmounts[i] > highestBidAmount) && (_bidAmounts[i] <= _stakeAmounts[i])) {
        highestBidAmount = _bidAmounts[i];
        highestBidder = _bidders[i];
      }
    }
    return (highestBidder, highestBidAmount);
  }

  /*
   * The callback function. Updates the contract state.
   */
  function updateWinner(address _highestBidder, uint _highestBidAmount) public
    //onlyEnigma() comment this out for testing
    {
    winner = _highestBidder;
    winningPrice = _highestBidAmount;
    state = AuctionState.COMPLETED;
    emit Winner(_highestBidder, _highestBidAmount);
  }

  /*
   * Allow a user to claim their reward.
   * Need a flag on whether the winner has withdrawn the reward
   */
  function claimReward() external {
    require(state == AuctionState.COMPLETED);
    require(msg.sender == winner);
    // insert reward transfer here.
  }

  /*
   * Modifier that checks that the contract caller is the Enigma contract.
   */
  modifier onlyEnigma() {
    require(msg.sender == address(enigma));
    _;
  }

  /*
   * Check that a user has bidded.
   */
  function hasBidded(address _bidder) public view returns (bool) {
    return bidders[_bidder].hasBidded;
  }

  /*
   * Get the encrypted bid value for a bidder.
   */
  function getBidValueForBidder(address _bidder) public view returns (bytes) {
    require(hasBidded(_bidder), "User has not bidded yet.");
    return bidders[_bidder].bidValue;
  }

  /*
   * Get the staked amount of Ether for a given bidder.
   */
  function getStakeOfBidder(address _bidder) public view returns (uint) {
    return stakeAmounts[_bidder];
  }

  /*
   * Get the winner of the auction (if available).
   */
  function getWinner() public view returns(address) {
    require(state == AuctionState.COMPLETED);
    return winner;
  }

}
