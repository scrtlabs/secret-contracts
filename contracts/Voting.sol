// Voting.sol, Andrew Tam
// TODO:
//  -Separate token staking from voting
//  -Timed polls

pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./VotingToken.sol";
import "./Enigma.sol";

contract Voting {
  using SafeMath for uint;

  /* EVENTS */
  event voteCasted(address voter, uint pollID, bytes vote, uint weight);
  event pollCreated(uint pollID, uint quorumPercentage, address creator, string description);
  event pollStatusUpdate(bool status);

  /* Determine the current state of a poll */
  enum PollStatus { IN_PROGRESS, TALLY, PASSED, REJECTED }

  /* POLL */
  struct Poll {
    address creator;
    PollStatus status;
    uint quorumPercentage;
    uint yeaVotes;
    uint nayVotes;
    string description;
    address[] voters;
    mapping(address => Voter) voterInfo;
  }

  /* VOTER */
  struct Voter {
    bool hasVoted;
    bytes vote;
    uint weight;
  }

  struct TokenManager {
    uint tokenBalance;
    mapping(uint => uint) lockedTokens;
    uint[] participatedPolls;
  }

  mapping(uint => Poll) public polls;
  mapping(address => TokenManager) public bank;
  uint public pollCount;
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
  function createPoll(uint _quorumPct, string _description) external returns(uint) {
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
  function endPoll(uint _pollID) public validPoll(_pollID) {
    require(msg.sender == polls[_pollID].creator, "User is not the creator of the poll.");
    require(polls[_pollID].status == PollStatus.IN_PROGRESS, "Vote is not in progress.");
    polls[_pollID].status = PollStatus.TALLY;
  }

  /*
   * Modifier that checks for a valid poll ID.
   */
  modifier validPoll(uint _pollID) {
    require(_pollID > 0 && _pollID <= pollCount, "Not a valid poll Id.");
    _;
  }

  /*
   * Checks if a poll was approved given the quorum percentage.
   */
  function updatePollStatus(uint _pollID, uint _yeaVotes, uint _nayVotes) public validPoll(_pollID) onlyEnigma() {
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

    updateTokenBank(_pollID);

    emit pollStatusUpdate(pollStatus);
  }

  function updateTokenBank(uint _pollID) internal {
    Poll memory curPoll = polls[_pollID];
    for (uint i = 0; i < curPoll.voters.length; i++) {
      address voter = curPoll.voters[i];
      bank[voter].lockedTokens[_pollID] = 0;
    }
  }

  /*
   * Gets the status of a poll.
   */
  function getPollStatus(uint _pollID) public view validPoll(_pollID) returns (PollStatus) {
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
   * Gets the encrypted vote and weight for a voter and a given ended poll.
   */
  function getPollInfoForVoter(uint _pollID, address _voter) public view validPoll(_pollID) returns (bytes, uint) {
    require(getPollStatus(_pollID) != PollStatus.IN_PROGRESS);
    require(userHasVoted(_pollID, _voter));
    Poll storage curPoll = polls[_pollID];
    bytes vote = curPoll.voterInfo[_voter].vote;
    uint weight = curPoll.voterInfo[_voter].weight;
    return (vote, weight);
  }

  function getVotersForPoll(uint _pollID) public view validPoll(_pollID) returns(address[]) {
    require(getPollStatus(_pollID) != PollStatus.IN_PROGRESS);
    return polls[_pollID].voters;
  }


  /* VOTE OPERATIONS */

  /*
   * Casts a vote for a given poll. Stakes ERC20 tokens as votes.
   * NOTE: _weight is denominated in *wei*.
   */
  function castVote(uint _pollID, bytes _encryptedVote, uint _weight) external validPoll(_pollID) {
    require(getPollStatus(_pollID) == PollStatus.IN_PROGRESS, "Poll has expired.");
    require(!userHasVoted(_pollID, msg.sender), "User has already voted.");
    require(getTokenStake(msg.sender) >= _weight, "User does not have enough staked tokens.");

    // update token bank
    bank[msg.sender].lockedTokens[_pollID] = _weight;
    bank[msg.sender].participatedPolls.push(_pollID);

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
  function countVotes(uint _pollID, uint[] _votes, uint[] _weights) public pure returns (uint, uint, uint) {
    require(_votes.length == _weights.length);
    uint yeaVotes;
    uint nayVotes;
    for (uint i = 0; i < _votes.length; i++) {
      if (_votes[i] == 0) nayVotes += _weights[i];
      else if (_votes[i] == 1) yeaVotes += _weights[i];
    }
    return (_pollID, yeaVotes, nayVotes);
  }

  /*
   * Checks if a user has voted for a specific poll.
   */
  function userHasVoted(uint _pollID, address _user) public view validPoll(_pollID) returns (bool) {
    return (polls[_pollID].voterInfo[_user].hasVoted);
  }
  /* TOKEN OPERATIONS */

  /*
   * Stakes tokens for a given voter.
   * NOTE:
   *  User must approve transfer of tokens.
   *  _numTokens is denominated in *wei*.
   */
  function stakeVotingTokens(uint _numTokens) external {
    require(token.balanceOf(msg.sender) >= _numTokens, "User does not have enough tokens");
    require(token.transferFrom(msg.sender, this, _numTokens), "User did not approve token transfer.");
    bank[msg.sender].tokenBalance += _numTokens;
  }

  /*
   * Allows a voter to withdraw voting tokens after a poll has ended.
   * NOTE: _numTokens is denominated in *wei*.
   */
  function withdrawTokens(uint _numTokens) external returns(uint) {
    uint largest = getLockedAmount(msg.sender);
    require(getTokenStake(msg.sender) - largest >= _numTokens, "User is trying to withdraw too many tokens.");
    bank[msg.sender].tokenBalance -= _numTokens;
    require(token.transfer(msg.sender, _numTokens));
    return _numTokens;
  }

  function getLockedAmount(address _voter) public view returns (uint) {
    TokenManager storage manager = bank[_voter];
    uint largest;
    for (uint i = 0; i < manager.participatedPolls.length; i++) {
      uint curPollID = manager.participatedPolls[i];
      if (manager.lockedTokens[curPollID] > largest) largest = manager.lockedTokens[curPollID];
    }
    return largest;
  }

  function getTokenStake(address _voter) public view returns(uint) {
    return bank[_voter].tokenBalance;
  }

  function getPollHistory(address _voter) public view returns(uint[]) {
    return bank[_voter].participatedPolls;
  }


}
