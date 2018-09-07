# Secret Contracts

This repository showcases example secret contracts such as secret voting and secret auctions.

# Design Features:

Voting: Locked token-weighting(similar to the PLCR model), support for multiple timed polls, custom quorum percentages.
Auction: Simple sealed bid auction.

# Instructions:

TBD, but check this out: https://github.com/enigmampc/enigma-docker-network

Once you have the network running(and the contracts are deployed):
1. Run npm install to install Node dependencies.
2. Run npm start, which starts a webpack server at localhost:8080.
4. Go to that URL and start testing the dApp!

# Important Notes:

* Several test scripts are outdated.
* I have taken parts from the 'enigma-contract' repository and included them in this repository such as the Enigma/Enigma Token contracts, the Enigma JS library files, and example test data.

# License

The Enigma Secret Contracts is free software: you can redistribute it and/or modify it under the terms of the MIT License.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the MIT License for more details.

You should have received a [copy](LICENSE) of the MIT License along with this program.  If not, see <https://opensource.org/licenses/>.
