const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const linkAbi = require("./ContractJson/Link.json");

describe("RamdomNumber", async ()=> {
    let RamdomNumber, ramdomNumber, VrfCoordinator, vrfCoordinator, link, deployer, per1, perLink;

    before(async ()=> {
        await hre.network.provider.request({ method: "hardhat_impersonateAccount",params: ["0x4c381016af2185b97e4f6944c125603320762237"],});

        link = await new ethers.Contract( "0x514910771AF9Ca656af840dff83E8264EcF986CA" , linkAbi);

        VrfCoordinator = await ethers.getContractFactory("VRFCoordinator");
        vrfCoordinator = await VrfCoordinator.deploy(link.address);

        RamdomNumber = await ethers.getContractFactory("RamdomNumber");
        ramdomNumber = await RamdomNumber.deploy(vrfCoordinator.address);

        [deployer, per1] = await ethers.getSigners();
        perLink = await ethers.getSigner("0x4c381016af2185b97e4f6944c125603320762237");

        await network.provider.send("hardhat_setBalance", [
            perLink.address,
            ethers.utils.formatBytes32String("5000000000000000000"),
        ]);
    });

    describe("Link balance in the contract", async ()=> {

        it("Shouldn't have balance", async ()=> {
            expect(await link.connect(deployer).balanceOf(ramdomNumber.address)).to.equal(0);
        });

        it("No link does not work", async ()=> {
            await expect(ramdomNumber.connect(deployer).getRandomNumber()).to.be.revertedWith("Not enough LINK - fill contract with faucet");
        });

        it("Should have balance", async ()=> {
            await link.connect(perLink).transfer(ramdomNumber.address, ethers.utils.parseEther("1000"));

            expect(await link.connect(deployer).balanceOf(ramdomNumber.address)).to.equal(ethers.utils.parseEther("1000"));
        });
    });

    describe("Security", async ()=> {
        it("Only the owner can execute the functions", async ()=> {
            await expect(ramdomNumber.connect(per1).getRandomNumber()).to.be.revertedWith("Ownable: caller is not the owner");
            await expect(ramdomNumber.connect(per1).setUntil(5)).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Get value", async ()=> {
        it("Start value must be 0", async ()=> {
            expect(await ramdomNumber.connect(deployer).until()).to.equal(1);
            expect(await ramdomNumber.connect(deployer).randomResult()).to.equal(0);
        });

        it("The 'Until' value must be modified", async ()=> {
            await ramdomNumber.connect(deployer).setUntil(5);
            expect(await ramdomNumber.connect(deployer).until()).to.equal(5);
        });

        it("Should return a random number in the given range", async ()=> {
            await ramdomNumber.connect(deployer).getRandomNumber();
            let requestId = await ramdomNumber.connect(deployer).lastRequestId();
            await vrfCoordinator.connect(deployer).callBackWithRandomness(requestId,"777",ramdomNumber.address);
            let value = await ramdomNumber.connect(deployer).randomResult();

            assert(value > 0);
            assert(value <= 5);
        });
    });
});