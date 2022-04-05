const {ethers} = require("hardhat");

async function main() {

  let link = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
  
  let VrfCoordinator = await ethers.getContractFactory("VRFCoordinator");
  let vrfCoordinator = await VrfCoordinator.deploy(link);

  let RamdomNumber = await ethers.getContractFactory("RamdomNumber");
  let ramdomNumber = await RamdomNumber.deploy(vrfCoordinator.address);

  console.log("Contract RamdomNumber address is: ", ramdomNumber.address);
}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});
