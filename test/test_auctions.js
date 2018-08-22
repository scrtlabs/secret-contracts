// THIS TEST ONLY WORKS WHEN CODE FOR TIME IS COMMENTED OUT

const Auction = artifacts.require("./Auction.sol");
const AuctionFactory = artifacts.require("./AuctionFactory.sol");
const Enigma = artifacts.require("./Enigma.sol");
const EnigmaToken = artifacts.require("./EnigmaToken.sol");

contract('AuctionFactory', async(accounts) => {
  it('Should create an Auction, make two bids, and find the winner.', function() {
    return AuctionFactory.deployed().then(async function(instance) {
      // create new Auction
      await instance.createAuction(10, web3.toWei(1), {from:web3.eth.accounts[0]});

      // get auction instance
      const auctionAddress = await instance.getAuctionAddresses();
      const auction = await Auction.at(auctionAddress[0]);

      const owner = await auction.owner.call();
      assert.equal(web3.eth.accounts[0], owner);

      // stake in contract
      await auction.stake({
        from: web3.eth.accounts[0],
        value: web3.toWei(1)
      });

      await auction.stake({
        from: web3.eth.accounts[1],
        value: web3.toWei(5)
      });

      // make first bid
      await auction.bid(web3.toWei(1), {from:web3.eth.accounts[0]});
      let hasBidded = await auction.hasBidded(web3.eth.accounts[0]);
      assert.equal(hasBidded, true);

      // make second bid
      await auction.bid(web3.toWei(2), {from:web3.eth.accounts[1]});
      hasBidded = await auction.hasBidded(web3.eth.accounts[1]);
      assert.equal(hasBidded, true);

      // end auction
      await auction.endAuction({from:web3.eth.accounts[0]});
      let auctionStatus = await auction.state.call();
      assert.equal(auctionStatus, 1);

      // calculate winner
      let [winner, amount] = await auction.getHighestBidder([web3.eth.accounts[0], web3.eth.accounts[1]], [1, 2], [1, 2]);

      // update state
      await auction.updateWinner(winner, amount);
      auctionStatus = await auction.state.call();
      assert.equal(auctionStatus, 2);

      // check some more assertions
      const checkWinner = await auction.getWinner();
      assert.equal(web3.eth.accounts[1], checkWinner);

      // withdraw
      await auction.withdraw({from:web3.eth.accounts[0]});
      await auction.withdraw({from:web3.eth.accounts[1]});

      // claim winnings
      await auction.claimReward({from:web3.eth.accounts[1]});
      await auction.claimEther({from:web3.eth.accounts[0]});

      let balance = await web3.eth.getBalance(auctionAddress[0]);
      assert.equal(balance.toNumber(), 0);
    });
  })
})
