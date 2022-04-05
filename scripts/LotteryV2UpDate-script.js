const {ethers} = require("hardhat");

async function main() {

    let [owner] = await ethers.getSigners();

    let link = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
  
    let VrfCoordinator = await ethers.getContractFactory("VRFCoordinator");
    let vrfCoordinator = await VrfCoordinator.deploy(link);

    let RamdomNumber = await ethers.getContractFactory("RamdomNumber");
    let ramdomNumber = await RamdomNumber.deploy(vrfCoordinator.address);

    let LotteryV1 = await ethers.getContractFactory("LotteryV1");
    let LotteryV2 = await ethers.getContractFactory("LotteryV2");

    let lotteryV1 = await upgrades.deployProxy(LotteryV1,[ramdomNumber.address, vrfCoordinator.address], {initializer: "initContract"});
    let lotteryV2 = await upgrades.upgradeProxy(lotteryV1, LotteryV2);

    await ramdomNumber.connect(owner).transferOwnership(lotteryV2.address);

    console.log("Contract address is: ", lotteryV2.address);
}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});