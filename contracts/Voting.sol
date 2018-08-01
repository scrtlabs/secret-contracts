// Voting.sol, Andrew Tam
// TODO:
//  -Separate token staking from voting
//  -Timed polls

pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./VotingToken.sol";
import "./Enigma.sol";

contract Voting {
  using SafeMath for uint256;

  /* EVENTS */
  event voteCasted(address voter, uint256 pollID, uint256 vote, uint256 weight);
  event pollCreated(uint256 pollID, uint256 quorumPercentage, address creator, string description);
  event pollStatusUpdate(bool status);

  /* Determine the current state of a poll */
  enum PollStatus { IN_PROGRESS, TALLY, PASSED, REJECTED }

  /* POLL */
  struct Poll {
    address creator;
    PollStatus status;
    uint256 quorumPercentage;
    uint256 yeaVotes;
    uint256 nayVotes;
    string description;
    address[] voters;
    mapping(address => Voter) voterInfo;
  }

  /* VOTER */
  struct Voter {
    bool hasVoted;
    uint256 vote;
    uint256 weight;
  }

  mapping(uint256 => Poll) public polls;
  uint256 public pollCount;
  VotingToken public token;
  Enigma public enigma;

  /* CONSTRUCTOR */
  constructor(address _token, address _enigma) public {
    require(_token != 0 && address(token) == 0);
    require(_enigma != 0 && address(enigma) == 0);
    token = VotingToken(_token);
    enigma = Enigma(_enigma);
  }

  /* POLL OPERATIONS */

  /*
   * Creates a new poll with a specified quorum percentage. Returns the poll ID of the new poll.
   */
  function createPoll(uint256 _quorumPct, string _description) external returns(uint256) {
    require(_quorumPct <= 100, "Quorum Percentage must be less than or equal to 100%");
    pollCount++;

    Poll storage curPoll = polls[pollCount];
    curPoll.creator = msg.sender;
    curPoll.status = PollStatus.IN_PROGRESS;
    curPoll.quorumPercentage = _quorumPct;
    curPoll.description = _description;

    emit pollCreated(pollCount, _quorumPct, msg.sender, _description);
    return pollCount;
  }

  /*
   * Ends a poll. Only the creator of a given poll can end that poll.
   */
  function endPoll(uint256 _pollID) public validPoll(_pollID) {
    require(msg.sender == polls[_pollID].creator, "User is not the creator of the poll.");
    require(polls[_pollID].status == PollStatus.IN_PROGRESS, "Vote is not in progress.");
    polls[_pollID].status = PollStatus.TALLY;
  }

  /*
   * Modifier that checks for a valid poll ID.
   */
  modifier validPoll(uint256 _pollID) {
    require(_pollID > 0 && _pollID <= pollCount, "Not a valid poll Id.");
    _;
  }

  /*
   * Checks if a poll was approved given the quorum percentage.
   * URGENT NOTE: The onlyEnigma modifier is currently commented out.
   */
  function updatePollStatus(uint256 _pollID, uint256 _yeaVotes, uint256 _nayVotes) public validPoll(_pollID)
    onlyEnigma() /* Add back for final launch */
    {
    require(getPollStatus(_pollID) == PollStatus.TALLY, "Poll has not expired yet.");
    Poll storage curPoll = polls[_pollID];
    curPoll.yeaVotes = _yeaVotes;
    curPoll.nayVotes = _nayVotes;

    bool pollStatus = (curPoll.yeaVotes.mul(100)) > curPoll.quorumPercentage.mul(curPoll.yeaVotes.add(curPoll.nayVotes));
    if (pollStatus) {
      curPoll.status = PollStatus.PASSED;
    }
    else {
      curPoll.status = PollStatus.REJECTED;
    }

    emit pollStatusUpdate(pollStatus);
  }

  /*
   * Gets the status of a poll.
   */
  function getPollStatus(uint256 _pollID) public view validPoll(_pollID) returns (PollStatus) {
    return polls[_pollID].status;
  }

  /*
   * Modifier that checks that the contract caller is the Enigma contract.
   */
  modifier onlyEnigma() {
    require(msg.sender == address(enigma));
    _;
  }

  /*
   * Gets the encrypted votes and weights for a given poll after it has ended.
   */
  function getInfoForPoll(uint256 _pollID) public validPoll(_pollID) returns (uint256[], uint256[]) {
    require(getPollStatus(_pollID) != PollStatus.IN_PROGRESS);
    Poll storage curPoll = polls[_pollID];
    uint256 numVoters = curPoll.voters.length;
    uint256[] memory votes = new uint256[](numVoters);
    uint256[] memory weights = new uint256[](numVoters);
    for (uint256 i = 0; i < numVoters; i++) {
      address curVoter = curPoll.voters[i];
      votes[i] = curPoll.voterInfo[curVoter].vote;
      weights[i] = curPoll.voterInfo[curVoter].weight;
    }
    return (votes, weights);
  }

  /* VOTE OPERATIONS */

  /*
   * Casts a vote for a given poll. Stakes ERC20 tokens as votes.
   * NOTE: _weight is denominated in *wei*.
   */
  function castVote(uint256 _pollID, uint256 _encryptedVote, uint256 _weight) external validPoll(_pollID) {
    require(getPollStatus(_pollID) == PollStatus.IN_PROGRESS, "Poll has expired.");
    require(!userHasVoted(_pollID, msg.sender), "User has already voted.");
    stakeVotingTokens(msg.sender, _weight);

    Poll storage curPoll = polls[_pollID];

    curPoll.voterInfo[msg.sender] = Voter({
        hasVoted: true,
        vote: _encryptedVote,
        weight: _weight
    });

    curPoll.voters.push(msg.sender);

    emit voteCasted(msg.sender, _pollID, _encryptedVote, _weight);
  }

  /*
   * The callable function that is computed by the SGX node.
   */
  function countVotes(uint256 _pollID, uint256[] _votes, uint256[] _weights) public pure returns (uint256 pollID, uint256 yeaVotes, uint256 nayVotes) {
    require(_votes.length == _weights.length);
    for (uint256 i = 0; i < _votes.length; i++) {
      if (_votes[i] == 0) nayVotes += _weights[i];
      else yeaVotes += _weights[i];
    }
    return (_pollID, yeaVotes, nayVotes);
  }

  /*
   * Checks if a user has voted for a specific poll.
   */
  function userHasVoted(uint256 _pollID, address _user) public view validPoll(_pollID) returns (bool) {
    return (polls[_pollID].voterInfo[_user].hasVoted);
  }

  /* TOKEN OPERATIONS */

  /*
   * Internal function that stakes tokens for a given voter.
   * NOTE:
   *  User must approve transfer of tokens.
   *  _numTokens is denominated in *wei*.
   *  Might add support for staking more tokens.
   */
  function stakeVotingTokens(address _voter, uint256 _numTokens) internal {
    require(token.balanceOf(_voter) >= _numTokens, "User does not have enough tokens");
    require(token.transferFrom(_voter, this, _numTokens), "User did not approve token transfer.");
  }

  /*
   * Allows a voter to withdraw voting tokens after a poll has ended.
   * NOTE: _numTokens is denominated in *wei*.
   */
  function withdrawTokens(uint256 _pollID) external validPoll(_pollID) returns(uint256) {
    require(getPollStatus(_pollID) == PollStatus.REJECTED ||  getPollStatus(_pollID) == PollStatus.PASSED, "Poll has not expired.");
    require(userHasVoted(_pollID, msg.sender), "User did not vote in the poll.");
    uint256 weight = polls[_pollID].voterInfo[msg.sender].weight;
    require(token.transfer(msg.sender, weight));
    return weight;
  }

}
