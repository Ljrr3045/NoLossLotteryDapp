# No Loss Lottery Dapp

---------------------------------------------------------------------------------------------------------
<br><br>
This project consists of a lottery system where participants do not lose their money. <br><br>

Each person at the time of buying their tickets (either with stablecoins or ETH) is investing their money from a community pool, which will <br>
later be changed to DAI and thus use the Compound Finances investment system, to generate interest. <br><br>

The money that the winner will take will be 95% of the interest generated in Compound Finances for 5 days. Subsequently, each participant <br>
will be able to recover their initial investment in DAI, USDC, USDT, or if they used ETH as a purchase currency, in WETH. <br><br>

Note: <br><br>

If at the time of executing the test of this project, you want to see how the case in which you want to withdraw your money in USDC and not in <br>
DAI would work, do the following in the document "test/LotteryV1_Test.js": <br><br>

xit("It should return all the money to the user in USDC" --> it("It should return all the money to the user in USDC" <br><br>
it("It should return all the money to the user in DAI" --> xit("It should return all the money to the user in DAI"
<br><br>
---------------------------------------------------------------------------------------------------------

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js
npx hardhat help
```
