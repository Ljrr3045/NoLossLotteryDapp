const {ethers} = require("hardhat");

async function main() {

  let [owner] = await ethers.getSigners();

  let link = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
  
  let VrfCoordinator = await ethers.getContractFactory("VRFCoordinator");
  let vrfCoordinator = await VrfCoordinator.deploy(link);

  let RamdomNumber = await ethers.getContractFactory("RamdomNumber");
  let ramdomNumber = await RamdomNumber.deploy(vrfCoordinator.address);

  let LotteryV1 = await ethers.getContractFactory("LotteryV1");
  let lotteryV1 = await upgrades.deployProxy(LotteryV1,[ramdomNumber.address, vrfCoordinator.address], {initializer: "initContract"});

  await ramdomNumber.connect(owner).transferOwnership(lotteryV1.address);

  console.log("Contract address is: ", lotteryV1.address);
}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});