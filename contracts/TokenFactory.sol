// Andrew Tam, TokenFactory.sol
// Allow the voting tokens to be minted from a simple crowdsale.

pragma solidity ^0.4.24;

import "./VotingToken.sol";

contract TokenFactory {
  address owner;  // where the Ether contributions are sent to
  uint256 public totalMinted;  // keep a tab on the number of voting tokens minted
  VotingToken public token;

  // NOTE: defines number of tokens minted, not ether spent
  event Contribution(address contributer, uint256 amount);

  /*
   * The constructor intializes a VotingToken.
   */
  constructor(address _token) public {
    owner = msg.sender;
    token = VotingToken(_token);
  }

  /*
   * Allow a user to pay for voting tokens.
   */
  function contribute() external payable {
    require(msg.value > 0, "User sent no ether.");
    owner.transfer(msg.value);  // transfer the Ether to the owner
    uint256 amount = msg.value * 10;  // define an arbitrary exchange rate
    token.mint(msg.sender, amount);  // mint tokens
    totalMinted += amount;
    emit Contribution(msg.sender, amount);
  }

  function() external payable {
    revert();
  }

}
