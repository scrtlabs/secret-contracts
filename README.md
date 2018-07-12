# Secret Contracts

This repository contains secret contracts that use the Enigma Protocol such as voting, TCRs, and auctions. The contracts are written in Solidity and the front-end will utilize the enigma-js library.

# Design Strategies:

Voting:
Locked token-weighting, multiple polls per contract, timed polls, specified quorum percentages.

TCRs:
TBD

Auctions:
TBD

To test the code(NOTE: no tests currently written):
1. Clone the repository.
2. Start a local Ganache node.
3. Run 'truffle migrate --network development' and 'truffle test' in the root of the directory.

# Important Notes:
In order to integrate my contract with the Enigma Protocol, I have included the Enigma and Enigma
token contracts in my repository in addition to the Enigma Javascript Library, which is located in
the enigma-lib folder. I also have slightly edited the Enigma contracts for interoperability. 
