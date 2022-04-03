// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@chainlink/contracts/src/v0.7/VRFConsumerBase.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
 
contract RamdomNumber is VRFConsumerBase, Ownable{

    using SafeMath for uint;

    bytes32 internal keyHash;
    bytes32 public lastRequestId;
    uint256 internal fee;
    uint256 public randomResult;
    uint public until;

    constructor(address vrfCoordinator) 
        VRFConsumerBase(
            vrfCoordinator,
            0x514910771AF9Ca656af840dff83E8264EcF986CA  
        )
    {
        keyHash = 0xAA77729D3466CA35AE8D28B3BBAC7CC36A5031EFDC430821C02BC31A238AF445;
        fee = 2 * 10 ** 18;
        until = 1;
    }
    
    function getRandomNumber() public onlyOwner returns(bytes32 requestId) {
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK - fill contract with faucet");
        lastRequestId = requestRandomness(keyHash, fee);
        return lastRequestId;
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        randomResult = randomness.mod(until).add(1);
    }

    function setUntil(uint _until) public onlyOwner{
        until = _until;
    }
}