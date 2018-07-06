/* Tests:
 * -Create poll
 * -Vote in poll
 * -Vote with invalid poll ID
 * -Vote with not enough tokens
 * -Check if poll passed
 * -Check if poll expired
 * -Check if user has voted
 * -Withdraw tokens
 * -Withdraw too many tokens
 */

var Voting = artifacts.require("./Voting.sol");
