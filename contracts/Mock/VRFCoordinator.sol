// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@chainlink/contracts/src/v0.7/tests/VRFCoordinatorMock.sol";

contract VRFCoordinator is VRFCoordinatorMock {

    constructor(address linkAddress) VRFCoordinatorMock(linkAddress){}
}