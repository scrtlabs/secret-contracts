// Registry.sol
// Enigma, 2018
// Implements a simple token curated registry.
// UNTESTED
// Heavily inspired from: https://github.com/skmgoldin/tcr/blob/master/contracts/Registry.sol
// Notes:
// -Currently no parameterizer
// -Missing function for increasing stake(needed for touch and remove edge case)

pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./VotingToken.sol";
import "./Voting.sol";

contract Registry {

  using SafeMath for uint;

  event Application(address owner, string candidate, uint stake);
  event newChallenge(address owner, bytes32 listingHash);
  event Whitelisted(bytes32 listingHash);

  enum ListingStatus { ABSENT, APPLYING, WHITELISTED }
  enum ChallengeStatus { IN_PROGRESS, PASSED, REJECTED }

  // need a way to end application status
  struct Listing {
    address owner;
    string data;
    uint stake;
    ListingStatus status;
    uint applyExpire;
    uint challengeID;
  }

  struct Challenge {
    address owner;
    uint pollID;
    bytes32 listingHash;
    uint stake;
    string data;
    ChallengeStatus status;
  }

  // Store state of registry
  uint[] public listingIndex;
  mapping(bytes32 => Listing) public listings; // keys are the keccak hash of the candidate string
  mapping(uint => Challenge) public challenges;

  // Simulate the parameterizer for now
  uint public minDeposit = 10;
  uint public dispensationPct = 10;
  uint public voteQuorum = 50;
  uint public applyStageLen = 60; // 60 seconds -> 1 minute apply time

  // Setup
  VotingToken public token;
  Voting public voting;
  string public name;

  /* CONSTRUCTOR */
  constructor(address _token, address _voting, string _name) public {
    require(_token != 0 && address(token) == 0);
    require(_voting != 0 && address(voting) == 0);
    token = VotingToken(_token);
    voting = Voting(_voting);
    name = _name;
  }

  /* LISTING RELATED FUNCTIONS */

  // NOTE: User needs to approve token transfer beforehand.
  function apply(uint _amount, string _candidate) external returns(bytes32) {
    // make sure the applicant has enough stake
    require(_amount >= minDeposit);
    bytes32 listingHash = keccak256(_candidate);

    // make sure that there isn't a duplicate application or that the candidate is already on the registry
    require(getListingStatus(listingHash) == ListingStatus.ABSENT);

    // create a new listing
    listings[listingHash] = Listing({
      owner: msg.sender,
      data: _candidate,
      stake: _amount,
      status: ListingStatus.APPLYING,
      applyExpire: block.timestamp.add(applyStageLen),
      challengeID: 0
    });

    // transfer stake and emit event
    require(token.transferFrom(msg.sender, this, _amount));
    emit Application(msg.sender, _candidate, _amount);
    return listingHash;
  }

  function updateListingStatus(bytes32 _listingHash) external {
    Listing storage listing = listings[_listingHash];
    require(now >= listing.applyExpire);
    require(msg.sender == listing.owner);
    require(listing.status == ListingStatus.APPLYING);
    require(listing.challengeID == 0 || challenges[listing.challengeID].status == ChallengeStatus.REJECTED);
    listing.status = ListingStatus.WHITELISTED;
    emit Whitelisted(_listingHash);
  }

  function exit(bytes32 _listingHash) external {
    require(getListingStatus(_listingHash) == ListingStatus.WHITELISTED);

    Listing storage listing = listings[_listingHash];
    require(msg.sender == listing.owner);

    uint amount = listing.stake;
    delete listings[_listingHash];

    require(token.transfer(msg.sender, amount));
  }


  /* EVERYTHING UNDER HERE IS VERY UNTESTED */

  /* CHALLENGE RELATED FUNCTIONS */
  function challenge(bytes32 _listingHash, string _data) external returns (uint) {
    Listing storage listing = listings[_listingHash];
    require(listing.status != ListingStatus.ABSENT);
    require(listing.challengeID == 0 || getChallengeStatus(listing.challengeID) == ChallengeStatus.REJECTED);

    // create new poll
    uint pollID = voting.createPoll(voteQuorum, _data, applyStageLen);

    // create new challenge
    challenges[pollID] = Challenge({
      owner: msg.sender,
      pollID: pollID,
      listingHash: _listingHash,
      stake: listing.stake,
      data: _data,
      status: ChallengeStatus.IN_PROGRESS
    });

    listing.challengeID = pollID;

    // transfer stake from challenger
    require(token.transferFrom(msg.sender, this, listing.stake));
    emit newChallenge(msg.sender, _listingHash);
    return pollID;
  }

  function endChallengePoll(uint _pollID) external {
    require(msg.sender == challenges[_pollID].owner);
    voting.endPoll(_pollID);
  }

  function updateChallengeStatus(uint _pollID) external {
    require(getChallengeStatus(_pollID) == ChallengeStatus.IN_PROGRESS);
    uint pollStatus = uint(voting.getPollStatus(_pollID));
    require(pollStatus > 1);  // make sure poll has ended
    if (pollStatus == 2) {
      challenges[_pollID].status = ChallengeStatus.PASSED;
    }
    else {
      challenges[_pollID].status = ChallengeStatus.REJECTED;
    }
  }

  /* HELPERS */
  function getListingStatus(bytes32 _listingHash) public returns (ListingStatus) {
    return listings[_listingHash].status;
  }

  function getListingData(bytes32 _listingHash) public returns (string) {
    return listings[_listingHash].data;
  }

  function getChallengeStatus(uint _challengeID) public returns (ChallengeStatus) {
    return challenges[_challengeID].status;
  }

}
