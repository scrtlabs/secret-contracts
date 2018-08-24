// EnigmaCollectible.sol

pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";

contract EnigmaCollectible is ERC721Token {

  /*
   * Create OpenZeppelin ERC721 token.
   */
  constructor (string _name, string _symbol) public ERC721Token(_name, _symbol) {

  }

  /*
   * Wrapper for minting a new ERC721 token.
   */
  function mintToken(address _to, uint _tokenId) public {
    super._mint(_to, _tokenId);
  }

}
