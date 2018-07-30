// Registry.sol, Andrew Tam
// Heavily inspired from: https://github.com/skmgoldin/tcr/blob/master/contracts/Registry.sol
// Notes:
// -Currently no parameterizer
// -Missing function for increasing stake(needed for touch and remove edge case)

pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./VotingToken.sol";
import "./Voting.sol";

contract Registry {

  using SafeMath for uint256;

  event Application(address owner, string candidate, uint256 stake);
  event Whitelisted(bytes32 listingHash);

  enum ListingStatus { ABSENT, APPLYING, WHITELISTED }
  enum ChallengeStatus { IN_PROGRESS, REJECTED, PASSED }

  // need a way to end application status
  struct Listing {
    address owner;
    string data;
    uint256 stake;
    uint256 applyExpire;
    ListingStatus status;
    uint256 challengeID;
  }

  struct Challenge {
    address owner;
    uint256 pollID;
    uint256 listingID;
    uint256 stake;
    string data;
    ChallengeStatus status;
  }

  // Store state of registry
  uint256[] public listingIndex;
  mapping(bytes32 => Listing) public listings; // keys are the keccak hash of the candidate string
  mapping(uint256 => Challenge) public challenges;

  // Simulate the parameterizer for now
  uint256 public minDeposit = 10;
  uint256 public dispensationPct = 10;
  uint256 public voteQuorum = 50;
  uint256 public applyStageLen = 60; // 60 seconds -> 1 minute apply time

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
  function apply(uint256 _amount, string _candidate) external returns(bytes32) {
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

    uint256 amount = listing.stake;
    delete listings[_listingHash];

    require(token.transfer(msg.sender, amount));
  }

  /* CHALLENGE RELATED FUNCTIONS */
  function challenge(bytes32 _listingHash, string _data) {
    Listing storage listing = listings[_listingHash];
    require(listing.status != ListingStatus.ABSENT);
    require(listing.challengeID == 0 || getChallengeStatus(listing.challengeID) == ChallengeStatus.REJECTED);


    /*
    -listing should be apply or WHITELISTED and there should not be a challenge for it already
    -stake should match listing stake
    -create timed poll based on parameterizer
    */


  }

  function voteinChallenge() {

  }

  /* HELPERS */
  function getListingStatus(bytes32 _listingHash) public returns (ListingStatus) {
    return listings[_listingHash].status;
  }

  function getListingData(bytes32 _listingHash) public returns (string) {
    return listings[_listingHash].data;
  }

  function getChallengeStatus(uint256 _challengeID) returns (ChallengeStatus) {
    return challenges[_challengeID].status;
  }

}
