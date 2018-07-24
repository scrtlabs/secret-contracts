# Secret Contracts

This repository showcases secret contracts that utilize the Enigma Protocol such as secret voting, secret auctions, and secret TCRs. The contracts are written in Solidity and the dApp front-end uses React and the Enigma JS library.

# Design Features:

Voting: Locked token-weighting, support for multiple polls, custom quorum percentages.

# Instructions:

Note: These instructions are specific to my setup and only work for someone running a remote SGX node.
1. Start Ganache and Core on the SGX server.
2. Run Surface locally, although in the future Core and Surface will be merged together. Make sure that you are using the correct ports.
3. Run "./deploy-ganache ganache_remote" in the root of this directory. This command deploys the contracts to the SGX node. I have already configured truffle.js and the dApp front-end to use the remote Ganache instance.
4. Run "npm start", which starts a webpack server on localhost:8080.
5. Go to that URL and start testing the dApp!

# Important Notes:

I have taken parts from the 'enigma-contract' repository and included them in this repository such as the Enigma/Enigma Token contracts, the Enigma JS library files, and example test data.
