// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
 
contract RamdomNumber is VRFConsumerBase, Ownable{
    
    using SafeMath for uint;

    bytes32 internal keyHash;
    uint256 internal fee;
    uint256 public randomResult;
    uint public until;

    constructor() 
        VRFConsumerBase(
            0x271682DEB8C4E0901D1a1550aD2e64D568E69909,
            0x514910771AF9Ca656af840dff83E8264EcF986CA  
        )
    {
        keyHash = 0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4;
        fee = 0.1 * 10 ** 18; // 0.1 LINK (Varies by network)
        until = 1;
    }
    
    function getRandomNumber() public onlyOwner returns(bytes32 requestId) {
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK - fill contract with faucet");
        return requestRandomness(keyHash, fee);
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        randomResult = randomness.mod(until).add(1);
    }

    function setUntil(uint _until) public onlyOwner{
        until = _until;
    }
}