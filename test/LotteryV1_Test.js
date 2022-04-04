const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const linkAbi = require("./ContractJson/Link.json");
const daiAbi = require("./ContractJson/Dai.json");
const usdcAbi = require("./ContractJson/Usdc.json");
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace");

describe("LotteryV1", async ()=> {
    let RamdomNumber, ramdomNumber, VrfCoordinator, vrfCoordinator, LotteryV1, lotteryV1, link, dai, usdc, admin, per1, per2, per3, perLink, perDai, perUsdc;

    before(async ()=> {
        await hre.network.provider.request({ method: "hardhat_impersonateAccount",params: ["0x4c381016af2185b97e4f6944c125603320762237"],});
        await hre.network.provider.request({ method: "hardhat_impersonateAccount",params: ["0x820c79d0b0c90400cdd24d8916f5bd4d6fba4cc3"],});
        await hre.network.provider.request({ method: "hardhat_impersonateAccount",params: ["0x7abe0ce388281d2acf297cb089caef3819b13448"],});

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
        perUsdc = await ethers.getSigner("0x7abe0ce388281d2acf297cb089caef3819b13448");

        await network.provider.send("hardhat_setBalance", [
            perLink.address,
            ethers.utils.formatBytes32String("5000000000000000000"),
        ]);

        await network.provider.send("hardhat_setBalance", [
            perDai.address,
            ethers.utils.formatBytes32String("5000000000000000000"),
        ]);

        await network.provider.send("hardhat_setBalance", [
            perUsdc.address,
            ethers.utils.formatBytes32String("5000000000000000000"),
        ]);

        await link.connect(perLink).transfer(ramdomNumber.address, ethers.utils.parseEther("1000"));
        await dai.connect(perDai).transfer(per1.address, ethers.utils.parseEther("1000"));
        await dai.connect(perDai).transfer(per2.address, ethers.utils.parseEther("1000"));
        await usdc.connect(perUsdc).transfer(per1.address, 1000000000);

        await ramdomNumber.connect(admin).transferOwnership(lotteryV1.address);
        await lotteryV1.connect(admin).initContract(ramdomNumber.address, vrfCoordinator.address);

        expect(await link.connect(perLink).balanceOf(ramdomNumber.address)).to.equal(ethers.utils.parseEther("1000"));
        expect(await dai.connect(perDai).balanceOf(per1.address)).to.equal(ethers.utils.parseEther("1000"));
        expect(await usdc.connect(perUsdc).balanceOf(per1.address)).to.equal(1001000000);
        expect(await dai.connect(perDai).balanceOf(per2.address)).to.equal(ethers.utils.parseEther("1000"));
        expect(await ramdomNumber.connect(admin).owner()).to.equal(lotteryV1.address);
    });

    describe("Start of contract", async ()=> {

        it("Error: Contract cannot be started twice", async ()=> {
            await expect(lotteryV1.connect(admin).initContract(
                ramdomNumber.address, 
                vrfCoordinator.address)
            ).to.be.revertedWith("Contract are init");
        });
    });

    describe("Purchase of tickets", async ()=> {

        describe("Buying ticket with token", async ()=> {

            it("Error: Cannot buy with ETH in this function", async ()=> {

                await expect(lotteryV1.connect(per1).buyTicketWithToken(
                    ethers.utils.parseEther("1000"), 
                    3)
                ).to.be.revertedWith("Eth is not allowed here");
            });

            it("Error: If pay less than the price of the ticket, you do not buy", async ()=> {

                await expect(lotteryV1.connect(per1).buyTicketWithToken(
                    ethers.utils.parseEther("1"), 
                    0)
                ).to.be.revertedWith("Not enough payment");
            });

            it("Error: Must buy an entire number of tickets", async ()=> {

                await expect(lotteryV1.connect(per1).buyTicketWithToken(
                    ethers.utils.parseEther("1234"), 
                    0)
                ).to.be.revertedWith("The number of tickets is not whole");
            });

            it("Error: Without approval you can not buy", async ()=> {

                await expect(lotteryV1.connect(per1).buyTicketWithToken(
                    ethers.utils.parseEther("1000"), 
                    0)
                ).to.be.revertedWith("Dai/insufficient-allowance");
            });

            it("Should be able to buy a Tickets with DAI", async ()=> {

                await dai.connect(per1).approve(lotteryV1.address, ethers.utils.parseEther("1000"));
                await lotteryV1.connect(per1).buyTicketWithToken(ethers.utils.parseEther("1000"), 0);

                expect(await dai.connect(per1).balanceOf(per1.address)).to.equal(0);
                expect(await dai.connect(per1).balanceOf(lotteryV1.address)).to.equal(ethers.utils.parseEther("1000"));

                expect(await lotteryV1.connect(per1).userTicketBalanceWithToken(
                    1, 
                    per1.address)
                ).to.equal(100);
            });

            it("Should be able to buy a Tickets with USDC", async ()=> {

                await usdc.connect(per1).approve(lotteryV1.address, 1000000000);
                await lotteryV1.connect(per1).buyTicketWithToken(1000000000, 1);

                expect(await usdc.connect(per1).balanceOf(per1.address)).to.equal(1000000);
                expect(await dai.connect(per1).balanceOf(lotteryV1.address)).to.equal("1999725167822715689082");

                expect(await lotteryV1.connect(per1).userTicketBalanceWithToken(
                    1, 
                    per1.address)
                ).to.equal(200);
            });

            it("Tickets sold in Round 1, part 1", async ()=> {

                expect(await lotteryV1.connect(per3).ticketCount(1)).to.equal(200);
            });
        });

        describe("Buying ticket with ETH", async ()=> {

            it("Error: If pay less than the price of the ticket, you do not buy", async ()=> {

                await expect(lotteryV1.connect(per3).buyTicketWithEth(
                    {value: 1}
                )).to.be.revertedWith("Not enough payment");
            });

            it("Error: Must buy an entire number of tickets", async ()=> {

                await expect(lotteryV1.connect(per3).buyTicketWithEth(
                    {value: ethers.utils.parseEther("0.1234")}
                )).to.be.revertedWith("The number of tickets is not whole");
            });

            it("Should be able to buy a Tickets", async ()=> {

                await lotteryV1.connect(per3).buyTicketWithEth({value: ethers.utils.parseEther("0.3")});

                expect(await ethers.provider.getBalance(lotteryV1.address)).to.equal(0);
                expect(await dai.connect(per1).balanceOf(lotteryV1.address)).to.equal("3038241007208178323898");

                expect(await lotteryV1.connect(per3).userTicketBalanceWithEth(
                    1, 
                    per3.address)
                ).to.equal("1038515839385462634816");
            });

            it("Tickets sold in Round 1, part 2 ", async ()=> {

                expect(await lotteryV1.connect(per3).ticketCount(1)).to.equal(300);
            });
        });

    });

    // describe("Withdrawal of money", async ()=> {

    // });

    // describe("Claim prime", async ()=> {

    // });
});