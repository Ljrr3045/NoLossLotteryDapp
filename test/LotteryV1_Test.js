const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const linkAbi = require("./ContractJson/Link.json");
const daiAbi = require("./ContractJson/Dai.json");
const usdcAbi = require("./ContractJson/Usdc.json");
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace");

describe("LotteryV1", async ()=> {
    let RamdomNumber, ramdomNumber, VrfCoordinator, vrfCoordinator, LotteryV1, lotteryV1, link, dai, usdc, admin, per1, per2, per3, perLink, perDai;

    before(async ()=> {
        await hre.network.provider.request({ method: "hardhat_impersonateAccount",params: ["0x4c381016af2185b97e4f6944c125603320762237"],});
        await hre.network.provider.request({ method: "hardhat_impersonateAccount",params: ["0x820c79d0b0c90400cdd24d8916f5bd4d6fba4cc3"],});

        link = await new ethers.Contract( "0x514910771AF9Ca656af840dff83E8264EcF986CA" , linkAbi);
        dai = await new ethers.Contract( "0x6B175474E89094C44Da98b954EedeAC495271d0F" , daiAbi);
        usdc = await new ethers.Contract( "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" , usdcAbi);

        VrfCoordinator = await ethers.getContractFactory("VRFCoordinator");
        vrfCoordinator = await VrfCoordinator.deploy(link.address);

        RamdomNumber = await ethers.getContractFactory("RamdomNumber");
        ramdomNumber = await RamdomNumber.deploy(vrfCoordinator.address);

        LotteryV1 = await ethers.getContractFactory("LotteryV1");
        lotteryV1 = await LotteryV1.deploy();

        [admin, per1, per2, per3] = await ethers.getSigners();
        perLink = await ethers.getSigner("0x4c381016af2185b97e4f6944c125603320762237");
        perDai = await ethers.getSigner("0x820c79d0b0c90400cdd24d8916f5bd4d6fba4cc3");

        await network.provider.send("hardhat_setBalance", [
            perLink.address,
            ethers.utils.formatBytes32String("5000000000000000000"),
        ]);

        await network.provider.send("hardhat_setBalance", [
            perDai.address,
            ethers.utils.formatBytes32String("5000000000000000000"),
        ]);

        await link.connect(perLink).transfer(ramdomNumber.address, ethers.utils.parseEther("1000"));
        await dai.connect(perDai).transfer(per1.address, ethers.utils.parseEther("1000"));
        await dai.connect(perDai).transfer(per2.address, ethers.utils.parseEther("1000"));

        await ramdomNumber.connect(admin).transferOwnership(lotteryV1.address);
        await lotteryV1.connect(admin).initContract(ramdomNumber.address, vrfCoordinator.address);

        expect(await link.connect(perLink).balanceOf(ramdomNumber.address)).to.equal(ethers.utils.parseEther("1000"));
        expect(await dai.connect(perDai).balanceOf(per1.address)).to.equal(ethers.utils.parseEther("1000"));
        expect(await dai.connect(perDai).balanceOf(per2.address)).to.equal(ethers.utils.parseEther("1000"));
        expect(await ramdomNumber.connect(admin).owner()).to.equal(lotteryV1.address);
    });

    describe("Start of contract", async ()=> {
        it("Error: Contract cannot be started twice", async ()=> {
            await expect(lotteryV1.connect(admin).initContract(ramdomNumber.address, vrfCoordinator.address)).to.be.revertedWith("Contract are init");
        });
    });

    describe("Purchase of tickets", async ()=> {

    });

    describe("Withdrawal of money", async ()=> {

    });

    describe("Claim prime", async ()=> {

    });
});