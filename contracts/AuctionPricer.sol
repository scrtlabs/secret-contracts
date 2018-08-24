// AuctionPricer.sol
// EXPERIMENTAL AND UNTESTED

pragma solidity ^0.4.24;

import "./Enigma.sol";

contract AuctionPricer {

  struct Pricer {
    bool hasPriced;
    bytes price;
  }

  mapping(address => Pricer) public pricers;
  uint public expireTime;
  uint public startingPrice;
  Enigma public enigma;

  constructor(address _enigma, uint _length) public {
    require(_enigma != 0 && address(enigma) == 0);
    enigma = Enigma(_enigma);
    expireTime = now + _length;
  }

  function sendPrice(bytes _price) external {
    require(now < expireTime);
    require(!pricers[msg.sender].hasPriced);
    pricers[msg.sender].price = _price;
  }

  function getAveragePrice(uint[] _prices) public pure returns (uint) {
    uint sum;
    for (uint i = 0; i < _prices.length; i++) {
      sum += _prices[i];
    }
    return sum/_prices.length;
  }

  function updateStartingPrice(uint _price) public onlyEnigma {
    startingPrice = _price;
  }

  function getPriceforUser(address _user) public returns (bytes) {
    require(pricers[_user].hasPriced);
    return pricers[_user].price;
  }

  modifier onlyEnigma() {
    require(msg.sender == address(enigma));
    _;
  }

}
