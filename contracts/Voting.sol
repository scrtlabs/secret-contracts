// Voting.sol, Andrew Tam
// NOTE: Anyone can vote and create a poll, prone to Sybil attacks.
pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./VotingToken.sol";
import "./Enigma.sol";

contract Voting {
  using SafeMath for uint256;

  /* EVENTS */
  event voteCasted(address voter, uint256 pollId, uint256 vote, uint256 weight);
  event pollCreated(uint256 pollId, uint256 quorumPercentage, uint256 votingTime, string description);
  event pollPassed(bool status);

  /* POLL */
  struct Poll {
    uint256 revealDate;
    uint256 quorumPercentage;
    uint256 yeaVotes;
    uint256 nayVotes;
    uint256 numVoters;  // Currently not used
    string description;
    mapping(address => Voter) voters;
  }

  /* VOTER */
  struct Voter {
    bool hasVoted;
    // vote will be encrypted in the future
    uint256 vote;  // false = no, true = yes
    uint256 weight;
  }

  mapping(uint256 => Poll) public polls;
  uint256 public pollCount;
  VotingToken public token;
  Enigma public enigma;

  /* CONSTRUCTOR */
  constructor(address _token, address _enigmaAddress) public {
    token = VotingToken(_token);
    enigma = Enigma(_enigmaAddress);
  }

  /*
   * Creates a new timed poll with a specified quorum percentage. Returns the poll ID of the new poll.
   */
  function createPoll(uint256 _quorumPct, uint256 _votingTime, string _description) external returns (uint256 pollId) {
    require(_quorumPct <= 100, "Quorum Percentage must be less than or equal to 100%");
    pollCount++;

    Poll storage curPoll = polls[pollCount];
    curPoll.revealDate = now.add(_votingTime);
    curPoll.quorumPercentage = _quorumPct;
    curPoll.description = _description;

    emit pollCreated(pollCount, _quorumPct, _votingTime, _description);
    return pollCount;
  }

  /*
   * Modifier that checks for a valid poll ID.
   */
  modifier validPoll(uint256 _pollId) {
    require(_pollId > 0 && _pollId <= pollCount, "Not a valid poll Id.");
    _;
  }

  modifier onlyEnigma() {
    require(msg.sender == address(enigma));
    _;
  }

  /*
   * Checks if a poll was approved given the quorum percentage.
   */
  function isPollPassed(uint256 _pollId, uint256 _yeaVotes, uint256 _nayVotes) public validPoll(_pollId) onlyEnigma() returns (bool pollStatus) {
    require(isPollExpired(_pollId), "Poll has not expired yet.");
    Poll memory curPoll = polls[_pollId];
    curPoll.yeaVotes = _yeaVotes;
    curPoll.nayVotes = _nayVotes;

    bool status = (curPoll.yeaVotes.mul(100)) > curPoll.quorumPercentage.mul(curPoll.yeaVotes.add(curPoll.nayVotes));

    emit pollPassed(status);
    return status;
  }

  /*
   * Checks if a poll has expired.
   */
  function isPollExpired(uint256 _pollId) public view validPoll(_pollId) returns (bool pollExpired) {
    return (now >= polls[_pollId].revealDate);
  }

  /*
   * The callable function that is computed by the SGX node.
   */
  function countVotes(uint256 _pollId, uint256[] votes, uint256[] weights) public pure returns (uint256 pollId, uint256 yeaVotes, uint256 nayVotes) {
    for (uint256 i = 0; i < votes.length; i++) {
      if (votes[i] == 0) nayVotes += weights[i];
      else yeaVotes += weights[i];
    }
    return (_pollId, yeaVotes, nayVotes);
  }

  /*
   * Casts a vote for a given poll. Stakes ERC20 tokens as votes.
   * NOTE: _weight is denominated in *wei*.
   */
  function castVote(uint256 _pollId, uint256 _encryptedVote, uint256 _weight) external validPoll(_pollId) {
    require(!isPollExpired(_pollId), "Poll has expired.");
    require(!userHasVoted(_pollId, msg.sender), "User has already voted.");
    stakeVotingTokens(msg.sender, _weight);

    Poll storage curPoll = polls[_pollId];

    curPoll.voters[msg.sender] = Voter({
        hasVoted: true,
        vote: _encryptedVote,
        weight: _weight
    });

    curPoll.numVoters++;
    emit voteCasted(msg.sender, _pollId, _encryptedVote, _weight);
  }

  /*
   * Checks if a user has voted for a specific poll.
   */
  function userHasVoted(uint256 _pollId, address _user) public view validPoll(_pollId) returns (bool hasVoted) {
    return (polls[_pollId].voters[_user].hasVoted);
  }

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
  function withdrawTokens(uint256 _numTokens, uint256 _pollId) external validPoll(_pollId) {
    require(isPollExpired(_pollId) && userHasVoted(_pollId, msg.sender), "Poll has not expired or user did not vote in the poll.");
    require(_numTokens <= polls[_pollId].voters[msg.sender].weight, "User is trying to withdraw too many tokens.");
    require(token.transfer(msg.sender, _numTokens));
  }


}
