// THIS TEST ONLY WORKS WHEN CODE FOR TIME IS COMMENTED OUT
// Add assert.equal statements

const Auction = artifacts.require("./Auction.sol");
const AuctionFactory = artifacts.require("./AuctionFactory.sol");
const Enigma = artifacts.require("./Enigma.sol");
const EnigmaToken = artifacts.require("./EnigmaToken.sol");

contract('AuctionFactory', async(accounts) => {
  it('Should create an Auction, make two bids, and find the winner.', function() {
    return AuctionFactory.deployed().then(async function(instance) {
      // create new Auction
      await instance.createAuction(10, 10, {from:web3.eth.accounts[0]});

      // get auction instance
      const auctionAddress = await instance.getAuctionAddresses();
      const auction = await Auction.at(auctionAddress[0]);

      const owner = await auction.owner.call();
      assert.equal(web3.eth.accounts[0], owner);

      // stake in contract
      await auction.stake({
        from: web3.eth.accounts[0],
        value: web3.toWei(10)
      });

      await auction.stake({
        from: web3.eth.accounts[1],
        value: web3.toWei(20)
      });

      // make first bid
      await auction.bid(10, {from:web3.eth.accounts[0]});

      // FAIL CASE
      //await auction.bid(5, {from:web3.eth.accounts[0]});

      let hasBidded = await auction.hasBidded(web3.eth.accounts[0]);
      assert.equal(hasBidded, true);

      // make second bid
      await auction.bid(20, {from:web3.eth.accounts[1]});
      hasBidded = await auction.hasBidded(web3.eth.accounts[1]);
      assert.equal(hasBidded, true);

      // end auction
      await auction.endAuction({from:web3.eth.accounts[0]});
      let auctionStatus = await auction.state.call();
      assert.equal(auctionStatus, 1);

      // calculate winner
      let [winner, amount] = await auction.getHighestBidder([web3.eth.accounts[0], web3.eth.accounts[1]], [10, 20], [10, 20]);

      // update state
      await auction.updateWinner(winner, amount);
      auctionStatus = await auction.state.call();
      assert.equal(auctionStatus, 2);

      // check some more assertions
      const checkWinner = await auction.getWinner();
      assert.equal(web3.eth.accounts[1], checkWinner);

      // withdraw

      // FAIL CASE
      //await auction.withdraw(web3.toWei(11), {from:web3.eth.accounts[0]});

      await auction.withdraw(web3.toWei(10), {from:web3.eth.accounts[0]});

      // FAIL CASE
      //await auction.withdraw(web3.toWei(20), {from:web3.eth.accounts[1]});

    });
  })
})
