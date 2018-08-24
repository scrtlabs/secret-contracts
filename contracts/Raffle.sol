// Raffle.sol
// UNTESTED

pragma solidity ^0.4.24;

import "./Enigma.sol";
import "./EnigmaCollectible.sol";

contract Raffle {

  event newEntry(address sender);

  struct Entry {
    bool hasEntered;
    bytes encryptedAddress;
  }

  mapping(address => Entry) public entries;
  uint public expireTime;
  address public winner;
  Enigma public enigma;
  EnigmaCollectible public enigmaCollectible;
  bool public rewardClaimed;

  constructor(address _enigma, address _enigmaCollectible, uint _length) public {
    require(_enigma != 0 && address(enigma) == 0);
    require(_enigmaCollectible != 0 && address(enigmaCollectible) == 0);
    enigma = Enigma(_enigma);
    enigmaCollectible = EnigmaCollectible(_enigmaCollectible);
    expireTime = now + _length;
  }

  function sendEntry(bytes _address) external {
    require(now < expireTime);
    require(!entries[msg.sender].hasEntered);
    entries[msg.sender].encryptedAddress = _address;
    emit newEntry(msg.sender);
  }

  function selectWinner(address[] _addresses, uint _rand) public pure returns (address) {
    uint index = uint(keccak256(abi.encodePacked(_rand + 1))) % _addresses.length;
    return _addresses[index];
  }

  function updateWinner(address _winner) public onlyEnigma {
    winner = _winner;
  }

  function claimReward() external {
    require(msg.sender == winner);
    require(!rewardClaimed);
    rewardClaimed = true;
    enigmaCollectible.mintToken(msg.sender, expireTime);  // mint an ERC721 Enigma Collectible with arbitrary tokenID (just use the end time)
  }

  function getEntry(address _participant) public returns (bytes) {
    require(entries[_participant].hasEntered);
    return entries[_participant].encryptedAddress;
  }

  modifier onlyEnigma() {
    require(msg.sender == address(enigma));
    _;
  }


}
