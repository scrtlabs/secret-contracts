// VotingToken.sol
// Enigma, 2018
// Create an OpenZeppelin MintableToken that will act as a voting token.

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
