// need to add some sort of token locking
// add events
// anyone can vote
// add modifier for valid poll
pragma solidity ^0.4.24;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracs/token/ERC20/StandardToken.sol";

contract Voting {
  using SafeMath for uint256;

  event voteCasted(address voter, uint256 pollId, bool vote, uint256 weight);
  event pollCreated(uint256 pollId, uint256 quorumPercentage, uint256 votingTime, string description);

  struct Poll {
    uint256 revealDate;
    uint256 quorumPercentage;
    uint256 yeaVotes;
    uint256 nayVotes;
    uint256 numVoters;  // sort of unnecessary
    string description;
    mapping(address => Voter) voters;
  }

  // use enum in future
  struct Voter {
    bool hasVoted;
    bool vote;  // false = no, true = yes
    uint256 weight;
  }

  mapping(uint256 => Poll) polls;
  uint256 pollCount;
  StandardToken token;  // not used for now

  constructor(address _token) public {
    token = StandardToken(_token);
  }

  // well, anyone can create a poll I guess
  function createPoll(uint256 _quorumPct, uint256 _votingTime, string _description) external returns (pollId) {
    require(_quorumPct <= 100, "Quorum Percentage must be less than or equal to 100%");
    pollCount++;
    polls[pollCount] = Poll({
        revealDate: now.add(_votingTime),
        quorumPercentage: _quorumPct,
        description: _description
    });
    pollCreated(pollCount, _quorumPct, _votingTime, _description);
    return pollCount;
  }

  function isPollPassed(uint256 _pollId) public view returns (bool) {
    require(isPollExpired(_pollId), "Poll has not expired yet.");
    Poll memory curPoll = polls[_pollId];
    return (curPoll.yeaVotes.mul(100)) > curPoll.quorumPercentage.mul(curPoll.yeaVotes.add(curPoll.nayVotes));
  }

  function isPollExpired(uint256 _pollId) public view returns (bool) {
    require(_pollId > 0 && _pollId <= pollCount, "Not a valid poll Id.");
    return (now >= polls[_polldId].revealDate);
  }

  function castVote(uint256 _pollId, bool _voteStatus, uint256 _weight) external {
    require(!isPollExpired(_pollId), "Poll has expired.")
    require(!userHasVoted(_pollId, msg.sender), "User has already voted.");
    stakeVotingTokens(_weight);

    Poll memory curPoll = polls[_pollId];
    if (_voteStatus) {
      curPoll.yeaVotes = curPoll.yeaVotes.add(_weight);
    }
    else {
      curPoll.nayVotes = curPoll.nayVotes.add(_weight);
    }

    curPoll.voters[msg.sender] = Voter({
        hasVoted: true,
        vote: _voteStatus,
        weight: _weight
    });

    curPoll.numVoters++;
    voteCasted(msg.sender, _pollId, _voteStatus, _weight);
  }

  function userHasVoted(uint256 _pollId, address _user) public view returns (bool) {
    return (polls[_pollId].voters[user].hasVoted);
  }

  /* Need to figure out token dynamics. */

  // user must approve transfer of tokens
  // need to add support for adding more tokens
  function stakeVotingTokens(uint256 _numTokens) internal {
    require(token.balanceOf(msg.sender) >= _numTokens, "User does not have enough tokens.");
    require(transferFrom(msg.sender, this, _numTokens), "User did not approve token transfer.");
  }

  // very rough
  function withdrawTokens(uint256 _numTokens, uint256 _pollId) external {
    require(isPollExpired(_pollId) && userHasVoted(_pollId, msg.sender), "Poll has not expired or user did not vote in the poll.");
    require(_numTokens <= polls[_pollId].voters[msg.sender].weight, "User is trying to withdraw too many tokens.");
    require(token.transfer(msg.sender, _numTokens));
  }


}
