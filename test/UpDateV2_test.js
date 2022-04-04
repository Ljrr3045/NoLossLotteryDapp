const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

describe("UpDate LotteryV2", async ()=> {
    let LotteryV1, LotteryV2, lotteryV1, lotteryV2;

    before(async ()=> {

        let link = "0x514910771AF9Ca656af840dff83E8264EcF986CA";

        let VrfCoordinator = await ethers.getContractFactory("VRFCoordinator");
        let vrfCoordinator = await VrfCoordinator.deploy(link);

        let RamdomNumber = await ethers.getContractFactory("RamdomNumber");
        let ramdomNumber = await RamdomNumber.deploy(vrfCoordinator.address);

        LotteryV1 = await ethers.getContractFactory("LotteryV1");
        LotteryV2 = await ethers.getContractFactory("LotteryV2");

        lotteryV1 = await upgrades.deployProxy(LotteryV1,[ramdomNumber.address, vrfCoordinator.address], {initializer: "initContract"});
        lotteryV2 = await upgrades.upgradeProxy(lotteryV1, LotteryV2);
    });

    it("Should update", async ()=> {

        expect(await lotteryV2.upDate()).to.equal(true);
    });
});
