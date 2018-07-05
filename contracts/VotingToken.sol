// Andrew Tam, VotingToken.sol
// VotingToken is an OpenZeppelin MintableToken that will act as a
// voting token in our set of voting systems.

pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/MintableToken.sol";

/*
 * Make the voting token a MintableToken.
 */
contract VotingToken is MintableToken {
  string public name = "Voting Token";
  string public symbol = "VOTE";
  uint256 public decimals = 18;
}
