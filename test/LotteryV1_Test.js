const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const linkAbi = require("./ContractJson/Link.json");
const daiAbi = require("./ContractJson/Dai.json");
const usdcAbi = require("./ContractJson/Usdc.json");
const wethAbi = require("./ContractJson/Weth.json");
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace");

describe("LotteryV1", async ()=> {
    let RamdomNumber, ramdomNumber, VrfCoordinator, vrfCoordinator, LotteryV1, 
    lotteryV1, link, dai, usdc, weth, admin, per1, per2, per3, perLink, perDai, perUsdc, winner;

    before(async ()=> {
        await hre.network.provider.request({ method: "hardhat_impersonateAccount",params: ["0x4c381016af2185b97e4f6944c125603320762237"],});
        await hre.network.provider.request({ method: "hardhat_impersonateAccount",params: ["0x820c79d0b0c90400cdd24d8916f5bd4d6fba4cc3"],});
        await hre.network.provider.request({ method: "hardhat_impersonateAccount",params: ["0x7abe0ce388281d2acf297cb089caef3819b13448"],});

        link = await new ethers.Contract( "0x514910771AF9Ca656af840dff83E8264EcF986CA" , linkAbi);
        dai = await new ethers.Contract( "0x6B175474E89094C44Da98b954EedeAC495271d0F" , daiAbi);
        usdc = await new ethers.Contract( "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" , usdcAbi);
        weth = await new ethers.Contract( "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" , wethAbi);

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
                ).to.equal(ethers.utils.parseEther("1000"));
            });

            it("Should be able to buy a Tickets with USDC", async ()=> {

                await usdc.connect(per1).approve(lotteryV1.address, 1000000000);
                await lotteryV1.connect(per1).buyTicketWithToken(1000000000, 1);

                expect(await usdc.connect(per1).balanceOf(per1.address)).to.equal(1000000);
                expect(ethers.utils.parseEther("1000")).to.be.at.most(
                    await dai.connect(per1).balanceOf(lotteryV1.address)
                );

                expect(ethers.utils.parseEther("1000")).to.be.at.most(
                    await lotteryV1.connect(per1).userTicketBalanceWithToken(1, per1.address)
                );
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

        describe("Fast forward two days in time", async ()=> {

            before(async ()=> {

                await network.provider.send("evm_increaseTime", [173000]);
                await network.provider.send("evm_mine");

                await lotteryV1.connect(admin).setUpDateDate();
            });
            
            it("Compound must have been started", async ()=> {

                expect(await lotteryV1.connect(admin).setCompone(1)).to.equal(true);
                expect(await dai.connect(per1).balanceOf(lotteryV1.address)).to.equal(0);
            });

            it("If tickets are purchased they are stored in Round 2", async ()=> {

                await dai.connect(per2).approve(lotteryV1.address, ethers.utils.parseEther("1000"));
                await lotteryV1.connect(per2).buyTicketWithToken(ethers.utils.parseEther("1000"), 0);

                expect(await dai.connect(per2).balanceOf(per2.address)).to.equal(0);
                expect(await dai.connect(per2).balanceOf(lotteryV1.address)).to.equal(ethers.utils.parseEther("1000"));

                expect(await lotteryV1.connect(per2).userTicketBalanceWithToken(
                    1, 
                    per2.address)
                ).to.equal(0);

                expect(ethers.utils.parseEther("1000")).to.be.at.most(
                    await lotteryV1.connect(per2).userTicketBalanceWithToken(2, per2.address)
                );

                expect(await lotteryV1.connect(per2).ticketCount(1)).to.equal(300);
                expect(await lotteryV1.connect(per2).ticketCount(2)).to.equal(100);
                expect(await lotteryV1.connect(per2).ticketCount(3)).to.equal(0);
                expect(await lotteryV1.connect(per2).lotteryRound()).to.equal(1);
            });
        });
    });

    describe("Withdrawal of money", async ()=> {

        before(async ()=> {

            await network.provider.send("evm_increaseTime", [433000]);
            await network.provider.send("evm_mine");

            await lotteryV1.connect(admin).setUpDateDate();
            expect(await lotteryV1.connect(per2).lotteryRound()).to.equal(2);
        });

        describe("Data must be updated", async ()=> {

            it("Round 1 Compound must be over", async ()=> {

                expect(await lotteryV1.connect(admin).setCompone(1)).to.equal(true);
                expect(await lotteryV1.connect(admin).setCompone(2)).to.equal(false);
                assert(await dai.connect(admin).balanceOf(lotteryV1.address) > ethers.utils.parseEther("1000"));
            });
    
            it("Winner has to be selected", async ()=> {
    
                winner = await lotteryV1.connect(admin).lotteryWinner(1);
    
                assert(winner > 0);
                assert(winner <= 300);
            });
        });

        describe("Withdraw money in token", async ()=> {

            it("Error: You can only withdraw in token", async ()=> {

                await expect(lotteryV1.connect(per1).getMyMoneyBackInToken(
                    3, 
                    1
                )).to.be.revertedWith("Eth is not allowed here");
            });

            it("Error: You can only withdraw if the round is over", async ()=> {

                await expect(lotteryV1.connect(per1).getMyMoneyBackInToken(
                    0, 
                    2
                )).to.be.revertedWith("Can't withdraw for this round yet");
            });

            it("Error: You can only withdraw if you have a balance to withdraw", async ()=> {

                await expect(lotteryV1.connect(per3).getMyMoneyBackInToken(
                    0, 
                    1
                )).to.be.revertedWith("Not have available balance in this round");
            });

            it("It should return all the money to the user in DAI", async ()=> {

                let balanceUserBefore = await dai.connect(per1).balanceOf(per1.address);
                let balanceLoterryBefore = await dai.connect(per1).balanceOf(lotteryV1.address);

                await lotteryV1.connect(per1).getMyMoneyBackInToken(0, 1);

                let balanceUserAfter = await dai.connect(per1).balanceOf(per1.address);
                let balanceLoterryAfter = await dai.connect(per1).balanceOf(lotteryV1.address);

                assert(balanceUserAfter > balanceUserBefore);
                assert(balanceLoterryAfter < balanceLoterryBefore);

                expect(await lotteryV1.connect(per1).userTicketBalanceWithToken(
                    1, 
                    per1.address)
                ).to.equal(0);
            });

            xit("It should return all the money to the user in USDC", async ()=> {

                let balanceUserBefore = await usdc.connect(per1).balanceOf(per1.address);
                let balanceLoterryBefore = await dai.connect(per1).balanceOf(lotteryV1.address);

                await lotteryV1.connect(per1).getMyMoneyBackInToken(1, 1);

                let balanceUserAfter = await usdc.connect(per1).balanceOf(per1.address);
                let balanceLoterryAfter = await dai.connect(per1).balanceOf(lotteryV1.address);

                assert(balanceUserAfter > balanceUserBefore);
                assert(balanceLoterryAfter < balanceLoterryBefore);

                expect(await lotteryV1.connect(per1).userTicketBalanceWithToken(
                    1, 
                    per1.address)
                ).to.equal(0);
            });
        });

        describe("Withdraw money in ETH", async ()=> {

            it("Error: You can only withdraw if the round is over", async ()=> {

                await expect(lotteryV1.connect(per3).getMyMoneyBackInEth(
                    2
                )).to.be.revertedWith("Can't withdraw for this round yet");
            });

            it("Error: You can only withdraw if you have a balance to withdraw", async ()=> {

                await expect(lotteryV1.connect(per1).getMyMoneyBackInEth(
                    1
                )).to.be.revertedWith("Not have available balance in this round");
            });

            it("It should return all the money to the user in ETH", async ()=> {

                let balanceLoterryBefore = await dai.connect(per1).balanceOf(lotteryV1.address);
                let balanceUserBefore2 = await weth.connect(per3).balanceOf(per3.address);
                expect(balanceUserBefore2).to.equal(0)

                await lotteryV1.connect(per3).getMyMoneyBackInEth(1);

                let balanceUserAfter2 = await weth.connect(per3).balanceOf(per3.address);
                let balanceLoterryAfter = await dai.connect(per1).balanceOf(lotteryV1.address);

                expect(balanceUserBefore2).to.be.at.most(balanceUserAfter2);
                expect(balanceLoterryAfter).to.be.at.most(balanceLoterryBefore);

                expect(await lotteryV1.connect(per1).userTicketBalanceWithEth(
                    1, 
                    per1.address)
                ).to.equal(0);
            });
        });
    });

    describe("Claim prime", async ()=> {

        it("Error: You can only withdraw if the round is over", async ()=> {

            await expect(lotteryV1.connect(per1).iWinWantToWithdraw(
                2
            )).to.be.revertedWith("Can't withdraw for this round yet");
        });

        it("Error: Only the winner can claim the prize", async ()=> {

            await expect(lotteryV1.connect(per3).iWinWantToWithdraw(
                1
            )).to.be.revertedWith("You are not the winner");
        });

        it("The winner should be able to claim the prize", async ()=> {

            let balanceUserBefore = await dai.connect(per1).balanceOf(per1.address);
            let balanceAdminBefore = await dai.connect(per1).balanceOf(admin.address);
            let balanceLoterryBefore = await dai.connect(per1).balanceOf(lotteryV1.address);
            expect(balanceAdminBefore).to.equal(0);

            await lotteryV1.connect(per1).iWinWantToWithdraw(1);

            let balanceUserAfter = await dai.connect(per1).balanceOf(per1.address);
            let balanceAdminAfter = await dai.connect(per1).balanceOf(admin.address);
            let balanceLoterryAfter = await dai.connect(per1).balanceOf(lotteryV1.address);

            expect(balanceUserBefore).to.be.at.most(balanceUserAfter);
            expect(balanceAdminBefore).to.be.at.most(balanceAdminAfter);
            expect(balanceLoterryAfter).to.be.at.most(balanceLoterryBefore);
            expect(0).to.be.at.most(balanceLoterryAfter);
        });

        it("Error: You can only claim the prize once", async ()=> {

            await expect(lotteryV1.connect(per1).iWinWantToWithdraw(
                1
            )).to.be.revertedWith("You already claimed your prize");
        });
    });

    describe("Admin access", async ()=> {

        it("Error: Only admin can give his role to another admin", async ()=> {

            await expect(lotteryV1.connect(per1).transferAdmin(per1.address)).to.be.revertedWith("Caller is not the Admin");
        });

        it("Error: Only admin can update data directly", async ()=> {

            await expect(lotteryV1.connect(per1).setUpDateDate()).to.be.revertedWith("Caller is not the Admin");
        });
    });
});