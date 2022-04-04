const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const daiAbi = require("./ContractJson/Dai.json");

xdescribe("Curve test", async ()=> {
    let CurveTest, curveTest, dai, per1, perDai, cambio;

    before(async ()=> {

        await hre.network.provider.request({ method: "hardhat_impersonateAccount",params: ["0x820c79d0b0c90400cdd24d8916f5bd4d6fba4cc3"],});

        CurveTest = await ethers.getContractFactory("CurveTest");
        curveTest = await CurveTest.deploy();

        dai = await new ethers.Contract( "0x6B175474E89094C44Da98b954EedeAC495271d0F" , daiAbi);

        [per1] = await ethers.getSigners();
        perDai = await ethers.getSigner("0x820c79d0b0c90400cdd24d8916f5bd4d6fba4cc3");

        await network.provider.send("hardhat_setBalance", [
            perDai.address,
            ethers.utils.formatBytes32String("5000000000000000000"),
        ]);
    });

    describe("Swap curve", async ()=> {

        // it("Swapp Token", async()=> {

        //     let sin = await usdt.connect(perDai).balanceOf(curveTest.address);

        //     expect(sin).to.equal(0);

        //     await dai.connect(perDai).approve(curveTest.address, ethers.utils.parseEther("50"));

        //     await curveTest.connect(perDai).swappDai();

        //     let cambio = await usdt.connect(perDai).balanceOf(curveTest.address);

        //     expect(cambio).to.equal(20);

        // });

        it("Swap ETH", async()=> {

            let sin = await dai.connect(per1).balanceOf(curveTest.address);

            expect(sin).to.equal(0);

            await curveTest.connect(per1).swappWth({value: ethers.utils.parseEther("1")});

            cambio = await dai.connect(per1).balanceOf(curveTest.address);

            expect(cambio).to.equal(20);
        });

        it("Mint compone", async()=> {

            await curveTest.connect(per1)._componeMint(cambio);

            let cambio2 = await dai.connect(per1).balanceOf(curveTest.address);

            expect(cambio2).to.equal(0);
        });

        it("debe tener", async()=> {

            let cambio2 = await curveTest.connect(per1)._getCTokenBalance();
            expect(cambio2).to.equal(0);
        });

        it("debe ganar dai", async()=> {

            await network.provider.send("evm_increaseTime", [2629800]);
            await network.provider.send("evm_mine")
            await curveTest.connect(per1)._componeRedeem(await curveTest.connect(per1)._getCTokenBalance());

            let cambio3 = await dai.connect(per1).balanceOf(curveTest.address);
            expect(cambio3).to.equal(0);
        });
    });
});